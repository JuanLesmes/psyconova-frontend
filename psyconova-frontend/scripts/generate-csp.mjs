/**
 * Genera la Content Security Policy a partir del HTML ya construido.
 *
 * ── Por que se genera y no se escribe a mano ──
 *
 * La CSP autoriza los scripts en linea por su hash. Angular genera dos de
 * ellos —los del reemplazo de eventos— y su contenido cambia entre versiones
 * del framework. Un hash escrito a mano se queda obsoleto en la siguiente
 * actualizacion y el sitio deja de arrancar, sin que nadie lo note hasta que
 * alguien lo abre.
 *
 * ── Por que del HTML CONSTRUIDO y no del fuente ──
 *
 * El build transforma el HTML: minifica, inserta los scripts de Angular e
 * incrusta el CSS critico. Un hash calculado sobre src/index.html no coincide
 * con nada de lo que acaba desplegandose.
 *
 * Corre en el `postbuild`, despues de copy-404.mjs.
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const RAIZ = 'dist/psyconova-frontend/browser';
const CUENTOS = 'assets/cuentos';

/**
 * Hash de un fragmento en linea, tal y como lo calcula el navegador.
 *
 * ── Por que se normalizan los saltos de linea ──
 *
 * El analizador de HTML convierte CRLF en LF antes de entregarle el contenido
 * al motor de scripts, asi que el navegador hashea la version con LF. Un
 * archivo guardado en Windows llega con CRLF y produce un hash distinto:
 * las-manadas.html pasa de 61.995 a 61.004 caracteres al normalizarlo, y solo
 * el segundo coincide.
 *
 * Sin esto la politica se ve correcta, se despliega, y el cuento deja de
 * funcionar para todo el mundo sin un solo aviso.
 */
const sha256 = contenido =>
  `'sha256-${createHash('sha256')
    .update(contenido.replace(/\r\n/g, '\n'), 'utf8')
    .digest('base64')}'`;

/**
 * Scripts en linea que el navegador EJECUTA.
 *
 * Se excluyen los que llevan `src` (esos los cubre 'self') y los bloques de
 * datos como application/ld+json o application/json: el navegador no los
 * ejecuta, asi que la CSP no los mira. Incluirlos solo alargaria la cabecera.
 */
const hashesDeScripts = html => {
  const re =
    /<script(?![^>]*\bsrc=)(?![^>]*type=["']application\/(?:ld\+json|json)["'])[^>]*>([\s\S]*?)<\/script>/g;
  return [...html.matchAll(re)].map(m => sha256(m[1]));
};

/**
 * Manejadores escritos como atributo: onload, onclick y compañia.
 *
 * Angular incrusta el CSS critico y difiere la hoja completa con
 *
 *   <link rel="stylesheet" media="print" onload="this.media='all'">
 *
 * Sin autorizar ese onload, la hoja se queda en `media="print"` y NUNCA se
 * aplica: el sitio sale a medio maquetar y no hay ningun error que lo diga.
 * Es la trampa mas silenciosa de toda la CSP.
 *
 * Autorizarlos exige `'unsafe-hashes'`, que suena peor de lo que es: permite
 * ejecutar exactamente estos fragmentos como atributo, nada mas.
 */
const hashesDeAtributos = html => {
  /**
   * Las comillas de dentro y las de fuera se tratan por separado.
   *
   * El primer intento usaba `["']([^"']+)["']`, que sobre
   * `onload="this.media='all'"` capturaba solo `this.media=`: la clase negada
   * corta en la primera comilla simple, que aqui es contenido, no delimitador.
   * El hash salia de un fragmento que no existe y el navegador lo rechazaba.
   */
  const dobles = [...html.matchAll(/\son[a-z]+="([^"]*)"/g)].map(m => m[1]);
  const simples = [...html.matchAll(/\son[a-z]+='([^']*)'/g)].map(m => m[1]);
  return [...dobles, ...simples].map(sha256);
};

/** Recorre el build y devuelve todos los .html. */
const buscarHtml = async (dir, base = '') => {
  const encontrados = [];
  for (const e of await readdir(join(RAIZ, dir || '.'), { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) encontrados.push(...(await buscarHtml(join(dir, e.name), rel)));
    else if (e.name.endsWith('.html')) encontrados.push(rel);
  }
  return encontrados;
};

const paginas = await buscarHtml('');
const delCuento = paginas.filter(p => p.startsWith(CUENTOS));
const deLaApp = paginas.filter(p => !p.startsWith(CUENTOS));

const recoger = async archivos => {
  const scripts = new Set();
  const atributos = new Set();
  for (const p of archivos) {
    const html = await readFile(join(RAIZ, p), 'utf8');
    hashesDeScripts(html).forEach(h => scripts.add(h));
    hashesDeAtributos(html).forEach(h => atributos.add(h));
  }
  return { scripts: [...scripts], atributos: [...atributos] };
};

const app = await recoger(deLaApp);
const cuento = await recoger(delCuento);

/**
 * Directivas comunes.
 *
 * `style-src 'unsafe-inline'` es la concesion inevitable: Angular inyecta los
 * estilos de cada componente en tiempo de ejecucion y no hay forma de saber
 * sus hashes de antemano. Es la mas benigna de las concesiones — un estilo
 * inyectado puede afear la pagina, no ejecutar codigo.
 */
const comunes = [
  `default-src 'self'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data:`,
  `font-src 'self'`,
  // El formulario va a una funcion serverless del propio dominio, y las
  // traducciones a /assets/i18n. Nada mas sale de aqui.
  `connect-src 'self'`,
  // Sin esto, un script inyectado podria cambiar el destino del formulario
  // y llevarse las consultas a otro servidor.
  `form-action 'self'`,
  // Impide que se reescriba <base> para colar rutas relativas hacia fuera.
  `base-uri 'self'`,
  `object-src 'none'`,
  // Equivale a X-Frame-Options, que ya esta en netlify.toml para navegadores
  // viejos que no entienden esta directiva.
  `frame-ancestors 'self'`,
  `upgrade-insecure-requests`,
];

/**
 * ── Dos avisos de Lighthouse que se dejan a proposito ──
 *
 * 1. «'unsafe-hashes' permite ejecutar manejadores en linea» (severidad alta).
 *
 *    Cierto en general, pero aqui la excepcion es un unico hash para un unico
 *    valor: `this.media='all'`. Para aprovecharlo habria que inyectar un
 *    elemento con exactamente ese atributo, y lo unico que consigue es cambiar
 *    el `media` de una hoja de estilos.
 *
 *    La alternativa seria apagar el CSS critico en linea (inlineCritical), y
 *    eso empeora el primer pintado a cambio de cerrar una puerta que no lleva
 *    a ninguna parte.
 *
 * 2. «Considera anadir 'unsafe-inline' para navegadores antiguos» (media).
 *
 *    NO se anade. El consejo vale para sitios que deben funcionar en
 *    navegadores anteriores a 2016, que son los que no entienden hashes. Esta
 *    aplicacion es Angular 21: esos navegadores no la ejecutan de ninguna
 *    manera, asi que no ganarian nada.
 *
 *    Y tendria un coste real: si algun dia un hash dejara de coincidir, en vez
 *    de fallar de forma ruidosa la politica pasaria a permitir cualquier
 *    script en linea, en silencio. Preferimos que se rompa a que se afloje sin
 *    que nadie se entere.
 */
const politicaApp = [
  ...comunes,
  `script-src 'self' ${app.scripts.join(' ')}`,
  // El mapa de Google. Solo se carga si el visitante lo acepta, pero la CSP
  // tiene que permitirlo de antemano o el iframe no llegaria a existir.
  `frame-src 'self' https://maps.google.com https://www.google.com`,
  app.atributos.length ? `script-src-attr 'unsafe-hashes' ${app.atributos.join(' ')}` : `script-src-attr 'none'`,
].join('; ');

/**
 * El cuento tiene su propia politica, mas cerrada.
 *
 * Se sirve desde este mismo dominio dentro de un iframe, asi que heredaria la
 * politica de la app si no se le diera una propia. Es un documento cerrado:
 * un script en linea, un bloque de estilos y ninguna peticion a ninguna parte.
 * No necesita ni frame-src ni connect-src.
 */
const politicaCuento = [
  ...comunes,
  `script-src 'self' ${cuento.scripts.join(' ')}`,
  `frame-src 'none'`,
  cuento.atributos.length
    ? `script-src-attr 'unsafe-hashes' ${cuento.atributos.join(' ')}`
    : `script-src-attr 'none'`,
].join('; ');

/**
 * Se escribe en _headers y no en netlify.toml porque este archivo cambia en
 * cada compilacion: mezclarlo con la configuracion versionada obligaria a
 * confirmar un cambio de hashes cada vez.
 *
 * Netlify combina los dos: las cabeceras fijas siguen viniendo de netlify.toml.
 */
const modoInforme = process.env['CSP_REPORT_ONLY'] === '1';
const cabecera = modoInforme
  ? 'Content-Security-Policy-Report-Only'
  : 'Content-Security-Policy';

const extra = modoInforme ? '; report-uri /csp-report' : '';

const contenido = [
  '# ARCHIVO GENERADO por scripts/generate-csp.mjs en cada build.',
  '# No editar a mano: los hashes cambian con cada version de Angular.',
  '',
  '/*',
  `  ${cabecera}: ${politicaApp}${extra}`,
  '',
  `/${CUENTOS}/*`,
  `  ${cabecera}: ${politicaCuento}${extra}`,
  '',
].join('\n');

await writeFile(join(RAIZ, '_headers'), contenido, 'utf8');

console.log(
  `  CSP          ${modoInforme ? 'MODO INFORME' : 'aplicando'}  ` +
  `app: ${app.scripts.length} scripts + ${app.atributos.length} atributos  |  ` +
  `cuento: ${cuento.scripts.length} scripts`
);

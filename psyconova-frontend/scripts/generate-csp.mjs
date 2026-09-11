/**
 * Genera la Content Security Policy a partir del HTML ya construido.
 *
 * La CSP autoriza los scripts en linea por su hash. Angular genera dos (los
 * del reemplazo de eventos) y su contenido cambia entre versiones del
 * framework: un hash escrito a mano queda obsoleto en la siguiente
 * actualizacion y el sitio deja de arrancar sin que nadie lo note. Se lee el
 * HTML construido y no el fuente porque el build minifica, inserta los scripts
 * de Angular e incrusta el CSS critico. Corre en el `postbuild`, tras copy-404.mjs.
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const RAIZ = 'dist/psyconova-frontend/browser';
const CUENTOS = 'assets/cuentos';

/**
 * Hash de un fragmento en linea, tal y como lo calcula el navegador.
 *
 * Se normalizan los saltos de linea porque el analizador de HTML convierte
 * CRLF en LF y solo entonces entrega el contenido al motor de scripts, asi que
 * el navegador hashea la version con LF. Un archivo guardado en Windows llega
 * con CRLF y daria un hash distinto: la politica se veria correcta, se
 * desplegaria, y el cuento dejaria de funcionar sin un solo aviso.
 */
const sha256 = contenido =>
  `'sha256-${createHash('sha256')
    .update(contenido.replace(/\r\n/g, '\n'), 'utf8')
    .digest('base64')}'`;

/**
 * Scripts en linea que el navegador ejecuta.
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
 * `<link rel="stylesheet" media="print" onload="this.media='all'">`. Sin
 * autorizar ese onload, la hoja se queda en `media="print"` y nunca se aplica:
 * el sitio sale a medio maquetar y ningun error lo dice. Autorizarlos exige
 * `'unsafe-hashes'`, que solo permite ejecutar exactamente estos fragmentos
 * como atributo, nada mas.
 */
const hashesDeAtributos = html => {
  /**
   * Las comillas de dentro y las de fuera se tratan por separado. Una clase
   * negada `[^"']+` cortaria `onload="this.media='all'"` en la primera comilla
   * simple, que aqui es contenido y no delimitador: el hash saldria de un
   * fragmento que no existe y el navegador lo rechazaria.
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
 * Directivas comunes. `style-src 'unsafe-inline'` es la concesion inevitable:
 * Angular inyecta los estilos de cada componente en tiempo de ejecucion y no
 * hay forma de saber sus hashes de antemano. Es la mas benigna de las
 * concesiones: un estilo inyectado puede afear la pagina, no ejecutar codigo.
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
 * Dos avisos de Lighthouse que se dejan a proposito.
 *
 * 1. «'unsafe-hashes' permite manejadores en linea»: aqui es un unico hash
 *    para `this.media='all'`, y lo unico que consigue es cambiar el `media` de
 *    una hoja. La alternativa (apagar inlineCritical) empeora el primer pintado.
 * 2. «Anadir 'unsafe-inline' para navegadores antiguos»: no se anade. Esos
 *    navegadores no ejecutan Angular 21 de ninguna manera, y si un hash dejara
 *    de coincidir la politica pasaria a permitir cualquier script en silencio.
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

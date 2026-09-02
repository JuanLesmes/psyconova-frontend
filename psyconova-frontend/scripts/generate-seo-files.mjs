/**
 * Genera sitemap.xml y robots.txt antes de cada compilacion.
 *
 * ── Por que se generan en vez de escribirse a mano ──
 *
 * El dominio suele acabar copiado en tres sitios: index.html, el sitemap y el
 * robots. Al cambiarlo, alguno se queda atras. Y un sitemap con el dominio
 * viejo le entrega al buscador una lista de URLs muertas, sin que nada avise.
 *
 * Aqui los dos archivos se derivan de site.config.ts, que es el mismo modulo
 * que usa la aplicacion para poner los canonical. No pueden discrepar: si
 * cambia la constante, cambian los tres a la vez en la siguiente compilacion.
 *
 * Node 24 lee TypeScript directamente, asi que se importa el modulo real en
 * lugar de mantener una copia de los datos en JavaScript.
 *
 * Corre solo, en el `prebuild` de package.json.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { SITE, PAGES, absoluteUrl } from '../src/app/core/config/site.config.ts';

const DESTINO = 'public';

/**
 * Sitemap deliberadamente minimo: solo <loc>.
 *
 * `priority` y `changefreq` los ignora Google desde hace anos. Y `lastmod`
 * solo sirve si es cierto: poner la fecha de compilacion diria que todas las
 * paginas cambian en cada despliegue, que es falso y le ensena al buscador a
 * desconfiar del dato.
 */
const paginas = Object.values(PAGES).filter(p => !p.noindex);

const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  paginas.map(p => `  <url>\n    <loc>${absoluteUrl(p.path)}</loc>\n  </url>\n`).join('') +
  `</urlset>\n`;

/**
 * El cuento queda fuera del indice.
 *
 * assets/cuentos/las-manadas.html se entrega en consulta con una palabra
 * clave. Esa puerta vive en el navegador y no es control de acceso real (ver
 * tales.config.ts), asi que el archivo se puede pedir por su URL.
 *
 * Esto no lo protege — sigue siendo alcanzable para quien tenga el enlace —
 * pero evita que aparezca en una busqueda y llegue a un nino por casualidad,
 * sin la psicologa delante y fuera de todo contexto.
 */
const robots =
  `User-agent: *\n` +
  `Allow: /\n` +
  `Disallow: /assets/cuentos/\n` +
  `\n` +
  `Sitemap: ${SITE.url}/sitemap.xml\n`;

await mkdir(DESTINO, { recursive: true });
await writeFile(`${DESTINO}/sitemap.xml`, sitemap, 'utf8');
await writeFile(`${DESTINO}/robots.txt`, robots, 'utf8');

console.log(`  sitemap.xml  ${paginas.length} URLs sobre ${SITE.url}`);
paginas.forEach(p => console.log(`    ${absoluteUrl(p.path)}`));
console.log(`  robots.txt   sitemap declarado, /assets/cuentos/ fuera del indice`);

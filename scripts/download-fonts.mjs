/**
 * Descarga las fuentes de Google y genera el CSS local que las declara.
 *
 * ── Por que autoalojarlas ──
 *
 * Con el @import a fonts.googleapis.com pasaban tres cosas malas:
 *
 * 1. PRIVACIDAD. Google recibia la IP de cada visitante nada mas abrir la
 *    pagina, antes de que nadie aceptara nada — justo mientras el sitio le
 *    pide permiso para cargar el mapa. Era la unica transferencia a terceros
 *    sin consentimiento que quedaba.
 *
 * 2. RENDIMIENTO. Un @import dentro del CSS encadena dos descargas: el
 *    navegador baja la hoja, la analiza, encuentra el @import y solo entonces
 *    pide la segunda. Y bloquea el pintado mientras tanto.
 *
 * 3. SALTO DE MAQUETACION. La fuente llega despues del primer pintado y el
 *    texto se recompone con otras metricas. Es la causa mas comun de CLS.
 *
 * ── Por que fuentes variables ──
 *
 * El CSS del sitio usa pesos 800 y 900 en 38 sitios, pero el @import solo
 * pedia hasta el 700: el navegador los estaba falsificando engordando el 700.
 * Un archivo variable cubre todo el rango en una sola descarga, asi que el
 * 900 de Roboto pasa a ser real.
 *
 * (Arimo solo llega a 700 por diseno de la propia fuente. Donde se pida 800
 * seguira sintetizandose, pero eso ya no depende de como se cargue.)
 *
 * Ejecutar con:  node scripts/download-fonts.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises';

const DESTINO_FUENTES = 'psyconova-frontend/src/assets/fonts';
const DESTINO_CSS = 'psyconova-frontend/src/styles/_fonts.scss';

/**
 * Solo latin y latin-ext.
 *
 * El sitio esta en espanol e ingles: cirilico, griego, hebreo y vietnamita
 * serian medio megabyte que nadie va a leer. Las tildes y la enie del espanol
 * viven en el subconjunto latin basico.
 */
const SUBCONJUNTOS = ['latin', 'latin-ext'];

/** Un navegador moderno: sin esto Google devuelve ttf en vez de woff2. */
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const URL_CSS =
  'https://fonts.googleapis.com/css2' +
  '?family=Arimo:wght@400..700' +
  '&family=Roboto:wght@300..900' +
  '&display=swap';

const css = await (await fetch(URL_CSS, { headers: { 'User-Agent': UA } })).text();

/**
 * Los bloques vienen precedidos de un comentario con el nombre del
 * subconjunto: `/* latin *\/` seguido de su @font-face.
 */
const bloques = [...css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]+\})/g)]
  .map(([, subconjunto, bloque]) => ({ subconjunto, bloque }))
  .filter(b => SUBCONJUNTOS.includes(b.subconjunto));

if (bloques.length === 0) {
  console.error('  ERROR: Google no devolvio ningun bloque para los subconjuntos pedidos.');
  process.exit(1);
}

await mkdir(DESTINO_FUENTES, { recursive: true });

const salida = [
  '// ARCHIVO GENERADO — no editar a mano.',
  '// Lo escribe scripts/download-fonts.mjs a partir de la respuesta de Google Fonts.',
  '// Para regenerarlo:  node scripts/download-fonts.mjs',
  '//',
  '// Las fuentes viven en src/assets/fonts/ y se sirven desde el propio dominio:',
  '// ninguna peticion sale a fonts.googleapis.com ni a fonts.gstatic.com.',
  '',
];

let total = 0;

for (const { subconjunto, bloque } of bloques) {
  const familia = /font-family:\s*'([^']+)'/.exec(bloque)?.[1];
  const pesos = /font-weight:\s*([^;]+);/.exec(bloque)?.[1].trim();
  const urlRemota = /url\((https:\/\/[^)]+\.woff2)\)/.exec(bloque)?.[1];

  if (!familia || !urlRemota) continue;

  const nombre = `${familia.toLowerCase()}-${subconjunto}.woff2`;
  const datos = Buffer.from(await (await fetch(urlRemota)).arrayBuffer());
  await writeFile(`${DESTINO_FUENTES}/${nombre}`, datos);
  total += datos.length;

  console.log(
    `  ${nombre.padEnd(26)} ${String(pesos).padEnd(10)} ${(datos.length / 1024).toFixed(1)} kB`
  );

  // Se reescribe el bloque en vez de reutilizarlo: cambia la url por la local
  // y se conserva el unicode-range, que es lo que evita descargar latin-ext a
  // quien solo lee caracteres del latin basico.
  const rango = /unicode-range:\s*([^;]+);/.exec(bloque)?.[1];

  salida.push(
    '@font-face {',
    `  font-family: '${familia}';`,
    `  font-style: normal;`,
    `  font-weight: ${pesos};`,
    // swap: el texto se ve desde el primer instante con la fuente de respaldo
    // y cambia al llegar la buena. La alternativa es texto invisible.
    `  font-display: swap;`,
    `  src: url('/assets/fonts/${nombre}') format('woff2');`,
    ...(rango ? [`  unicode-range: ${rango};`] : []),
    '}',
    ''
  );
}

await writeFile(DESTINO_CSS, salida.join('\n'), 'utf8');

console.log('');
console.log(`  ${bloques.length} archivos, ${(total / 1024).toFixed(1)} kB en total`);
console.log(`  CSS generado en ${DESTINO_CSS}`);

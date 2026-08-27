/**
 * Convierte las imágenes del sitio a WebP, al tamaño en que realmente se muestran.
 *
 *   npm run optimize:images
 *
 * Los originales viven en design/source-images/ y NO se despliegan.
 * El resultado va a src/assets/images/, que es lo que llega al navegador.
 *
 * Para añadir imágenes nuevas: deja los originales en la carpeta de origen
 * correspondiente y vuelve a ejecutar el script.
 */
import { readdir, mkdir, stat } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import sharp from 'sharp';

const JOBS = [
  {
    nombre: 'intro-story',
    from: 'design/source-images/intro-story',
    to: 'src/assets/images/intro-story',
    // El portal del componente mide 336x460 px como máximo: 672 cubre retina.
    width: 672,
    quality: 82,
  },
  {
    nombre: 'team',
    from: 'design/source-images/team',
    to: 'src/assets/images/team',
    // El marco de la tarjeta mide 260x340 px: al doble cubre pantallas retina.
    width: 520,
    height: 680,
    quality: 84,
    /**
     * Recorte por archivo, en píxeles del original.
     *
     * El recorte automático de sharp no sirvió aquí: dejaba media foto de
     * cielo y la cara abajo del encuadre. Con coordenadas explícitas se
     * controla dónde queda el rostro.
     *
     * Para ajustarlo: abre el original, mira las coordenadas del recorte que
     * quieres y cámbialas aquí. `top` baja el encuadre, `height` hace zoom
     * (menos alto = más cerca). La proporción debe ser 520/680 = 0.765.
     */
    recortes: {
      // laura.jpeg: original de 3024x4032. Encuadre de cabeza y hombros, con
      // aire arriba porque el marco de la tarjeta es un arco redondeado que
      // recorta las esquinas superiores.
      'laura': { left: 934, top: 1280, width: 1285, height: 1680 },
    },
  },
  {
    nombre: 'branding',
    from: 'design/source-images/branding',
    to: 'src/assets/images/branding',
    // El logo más grande se muestra a 130 px de alto (footer): 400 cubre retina.
    width: 400,
    quality: 88,
  },
];

const kb = bytes => (bytes / 1024).toFixed(0).padStart(6) + ' KB';
const mb = bytes => (bytes / 1048576).toFixed(2) + ' MB';

let totalAntes = 0;
let totalDespues = 0;

for (const job of JOBS) {
  let files;
  try {
    const validas = ['.png', '.jpg', '.jpeg'];
    files = (await readdir(job.from)).filter(f => validas.includes(extname(f).toLowerCase())).sort();
  } catch {
    console.log(`(sin originales en ${job.from}, se omite)`);
    continue;
  }

  if (files.length === 0) continue;

  await mkdir(job.to, { recursive: true });
  const medidaTxt = job.height ? `${job.width}x${job.height}px` : `ancho ${job.width}px`;
  console.log(`\n${job.nombre}  ->  ${medidaTxt}, calidad ${job.quality}`);

  for (const file of files) {
    const from = join(job.from, file);
    const to = join(job.to, basename(file, extname(file)) + '.webp');

    const { size: origen } = await stat(from);
    const nombreBase = basename(file, extname(file));
    const recorte = job.recortes?.[nombreBase];

    let pipeline = sharp(from);
    if (recorte) pipeline = pipeline.extract(recorte);

    const medida = job.height
      ? { width: job.width, height: job.height, fit: 'cover' }
      : { width: job.width, withoutEnlargement: true };

    await pipeline.resize(medida).webp({ quality: job.quality }).toFile(to);
    const { size: destino } = await stat(to);

    totalAntes += origen;
    totalDespues += destino;

    const ahorro = (100 - (destino / origen) * 100).toFixed(1);
    console.log(`  ${basename(to).padEnd(34)} ${kb(origen)} -> ${kb(destino)}  (-${ahorro}%)`);
  }
}

console.log('');
console.log(
  `Total: ${mb(totalAntes)} -> ${mb(totalDespues)}  (-${(100 - (totalDespues / totalAntes) * 100).toFixed(1)}%)`
);

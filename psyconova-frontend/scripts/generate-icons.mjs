/**
 * Genera los iconos del sitio a partir del logo original.
 *
 * ── Por que hacia falta ──
 *
 * El favicon era un PNG de 500x500 y 121 kB, declarado en el HTML como
 * `sizes="32x40"`. Se descargaba entero en cada visita para pintarse en una
 * pestana de 16 pixeles: era el segundo archivo mas pesado de la portada,
 * por delante de la foto de la psicologa y de las fuentes.
 *
 * Ninguna compresion del servidor lo arregla, porque un PNG ya viene
 * comprimido. La unica solucion es no mandar 500x500 para pintar 16.
 *
 * Ejecutar con:  node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';

const ORIGEN = 'src/assets/icons/faviconPsyconova.png';
const DESTINO = 'src/assets/icons';

/**
 * Tres tamanos, cada uno con su motivo:
 *
 *   32   la pestana del navegador y los marcadores. Es el que se pide siempre.
 *   180  el icono de "anadir a la pantalla de inicio" en iOS.
 *   192  el mismo caso en Android, y el que usan los buscadores para la ficha.
 *
 * No se genera el de 16: los navegadores reducen el de 32 sin que se note, y
 * un archivo menos es una peticion menos.
 */
const TAMANOS = [
  [32, 'favicon-32.png'],
  [180, 'apple-touch-icon.png'],
  [192, 'icon-192.png'],
];

await mkdir(DESTINO, { recursive: true });

const original = (await stat(ORIGEN)).size;
console.log(`  original: ${(original / 1024).toFixed(1)} kB\n`);

let total = 0;

for (const [lado, nombre] of TAMANOS) {
  const info = await sharp(ORIGEN)
    .resize(lado, lado, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    // compressionLevel 9 y palette: un logo tiene pocos colores planos, asi
    // que una paleta indexada pesa mucho menos que color verdadero sin que
    // se note ninguna diferencia.
    .png({ compressionLevel: 9, palette: true })
    .toFile(`${DESTINO}/${nombre}`);

  total += info.size;
  console.log(`  ${nombre.padEnd(24)} ${lado}x${lado}   ${(info.size / 1024).toFixed(1)} kB`);
}

console.log('');
console.log(
  `  los tres juntos: ${(total / 1024).toFixed(1)} kB  ` +
  `(antes uno solo pesaba ${(original / 1024).toFixed(1)} kB)`
);

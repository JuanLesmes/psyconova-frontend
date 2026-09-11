/**
 * Genera los iconos del sitio a partir del logo original.
 *
 * Un PNG de 500x500 declarado como favicon se descarga entero en cada visita
 * para pintarse en una pestana de 16 pixeles, y ninguna compresion del
 * servidor lo arregla porque un PNG ya viene comprimido. La unica solucion es
 * no mandar 500x500 para pintar 16.
 *
 * Ejecutar con:  node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';

const ORIGEN = 'design/faviconPsyconova-original.png';
const DESTINO = 'src/assets/icons';

/**
 * Tres tamanos: 32 para la pestana y los marcadores (el que se pide siempre),
 * 180 para "anadir a la pantalla de inicio" en iOS y 192 para lo mismo en
 * Android y para la ficha de los buscadores. No hay 16: los navegadores
 * reducen el de 32 sin que se note, y un archivo menos es una peticion menos.
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

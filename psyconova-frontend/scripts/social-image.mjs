/**
 * Genera la imagen que WhatsApp, LinkedIn y X muestran al compartir el enlace.
 *
 * 1200x630 es la proporcion que piden los tres. Mas pequena y la escalan
 * borrosa; con otra proporcion, la recortan por donde no toca.
 *
 * Se genera en vez de dibujarse a mano para que salga de los mismos colores
 * de marca que usa la pantalla de carga: si la paleta cambia, se regenera y
 * ya. Ejecutar con:  node scripts/social-image.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const ANCHO = 1200;
const ALTO = 630;
const SALIDA = 'src/assets/images/social/psyconova-og.jpg';
const LOGO = 'src/assets/images/branding/logoClaroConLetrasSinFondo.webp';

/**
 * El mismo degradado de la pantalla de carga: dos halos de color sobre un
 * fondo azul profundo. En SVG los halos son radialGradient con parada
 * transparente, que es como se traduce el `radial-gradient` del CSS.
 */
const fondo = `
<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#0d1340"/>
      <stop offset="50%"  stop-color="#19206d"/>
      <stop offset="100%" stop-color="#0a0826"/>
    </linearGradient>
    <radialGradient id="halo1" cx="30%" cy="30%" r="55%">
      <stop offset="0%"   stop-color="#72dfd1" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#72dfd1" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="halo2" cx="72%" cy="72%" r="55%">
      <stop offset="0%"   stop-color="#c8b2f7" stop-opacity="0.24"/>
      <stop offset="100%" stop-color="#c8b2f7" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${ANCHO}" height="${ALTO}" fill="url(#base)"/>
  <rect width="${ANCHO}" height="${ALTO}" fill="url(#halo1)"/>
  <rect width="${ANCHO}" height="${ALTO}" fill="url(#halo2)"/>

  <!-- Anillos: el mismo motivo de la pantalla de carga, quietos. -->
  <g fill="none" stroke="#72dfd1" stroke-opacity="0.16">
    <circle cx="${ANCHO / 2}" cy="${ALTO / 2 - 30}" r="200"/>
    <circle cx="${ANCHO / 2}" cy="${ALTO / 2 - 30}" r="278" stroke="#c8b2f7" stroke-opacity="0.12"/>
  </g>
</svg>`;

/** El lema, debajo del logo. Va como SVG para no depender de fuentes del sistema. */
const lema = `
<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="90">
  <text x="${ANCHO / 2}" y="52"
        font-family="Arial, Helvetica, sans-serif"
        font-size="27" font-weight="600" letter-spacing="6.5"
        fill="#72dfd1" fill-opacity="0.85" text-anchor="middle">
    PSICOLOGÍA · TECNOLOGÍA · HUMANIDAD
  </text>
</svg>`;

/**
 * El logo, en blanco. Ninguna variante de assets trae el texto en claro: la
 * palabra PSYCONOVA es azul oscuro, pensada para fondo blanco, e ilegible
 * sobre este degradado. La pantalla de carga resuelve lo mismo con
 * `filter: brightness(0) invert(1)`; aqui se hace la operacion equivalente:
 * se toma solo el canal alfa del original y se usa como transparencia de un
 * rectangulo blanco, asi la imagen social y la pantalla de carga muestran
 * exactamente la misma marca.
 */
const LADO = 300;

const escalado = sharp(LOGO).resize(LADO, LADO, { fit: 'inside' }).ensureAlpha();
const { width: aw, height: ah } = await escalado.clone().metadata();
const alfa = await escalado.clone().extractChannel('alpha').toBuffer();

const logo = await sharp({
  create: { width: aw, height: ah, channels: 3, background: '#ffffff' },
})
  .joinChannel(alfa)
  .png()
  .toBuffer();

await mkdir(dirname(SALIDA), { recursive: true });

const info = await sharp(Buffer.from(fondo))
  .composite([
    { input: logo, top: Math.round(ALTO / 2 - ah / 2 - 46), left: Math.round(ANCHO / 2 - aw / 2) },
    { input: Buffer.from(lema), top: Math.round(ALTO / 2 + 62), left: 0 },
  ])
  // JPEG y no WebP: algunos lectores de enlaces todavia no leen WebP y
  // muestran la tarjeta sin imagen, que es peor que un archivo un poco mayor.
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(SALIDA);

console.log(
  `  ${SALIDA}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} kB`
);

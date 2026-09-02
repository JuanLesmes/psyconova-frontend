/**
 * Copia la pagina de error a 404.html, en la raiz del build.
 *
 * ── Por que hace falta este paso ──
 *
 * Netlify busca un archivo llamado exactamente `404.html` en la raiz de lo
 * publicado y lo sirve, con codigo 404 de verdad, para cualquier direccion
 * que no corresponda a un archivo.
 *
 * Angular prerenderiza la ruta /404 como `404/index.html`, que no es ese
 * nombre. Sin esta copia, Netlify no encontraria la pagina y respondaria con
 * su propio 404 generico, sin la marca ni las lineas de crisis.
 *
 * Se deja tambien `404/index.html` donde estaba: si alguien escribe
 * /404 a mano, esa direccion sigue funcionando.
 *
 * Corre solo, en el `postbuild` de package.json.
 */
import { copyFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';

const RAIZ = 'dist/psyconova-frontend/browser';
const ORIGEN = `${RAIZ}/404/index.html`;
const DESTINO = `${RAIZ}/404.html`;

try {
  await access(ORIGEN, constants.R_OK);
} catch {
  // Fallar aqui es preferible a desplegar sin pagina de error: el sitio
  // seguiria devolviendo la portada con codigo 200 para cualquier URL
  // inventada, y nadie lo notaria hasta ver la caida en el buscador.
  console.error(
    `\n  ERROR: no existe ${ORIGEN}\n` +
    `  La ruta /404 no se prerenderizo. Revisa que siga declarada en\n` +
    `  app.routes.ts y que el build diga "Prerendered N static routes".\n`
  );
  process.exit(1);
}

await copyFile(ORIGEN, DESTINO);
console.log(`  404.html     copiado a la raiz del build (lo sirve Netlify con codigo 404)`);

# 09 · Despliegue y operación

El sitio se aloja en **Netlify** y se publica solo cada vez que se sube algo a `main`.

Este documento explica cómo funciona y qué hacer cuando algo va mal: la configuración de
Netlify, las variables de entorno, el dominio y el correo, los costos y la operación del
día a día. Lo que atañe sólo al formulario (campo trampa, `reply_to`, prueba en local) está
en [07 · Formulario](./07-formulario-de-contacto.md).

## Arquitectura del despliegue

- **GitHub**, rama `main`. Cada push avisa a Netlify por webhook. GitHub Actions corre
  lint, pruebas y build en cada push a `main` y en cada Pull Request
  (`.github/workflows/ci.yml`, Node 24).
- **Netlify**, dos piezas:
  - **CDN de archivos estáticos.** Sirve el HTML prerenderizado de cada página, el
    JavaScript, el CSS, las fuentes, las imágenes, `sitemap.xml`, `robots.txt`, `404.html`
    y las cabeceras de `netlify.toml` y `_headers`. Aquí llega casi todo el tráfico.
  - **Funciones serverless.** Sólo `contact`. Se ejecuta bajo demanda. Dentro viven las
    variables de entorno `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL`.
- **Resend** recibe la llamada de la función y entrega el correo al buzón de contacto.
- **Squarespace Domains** apunta `psyconova.com` a Netlify mediante DNS, y aloja los
  registros SPF, DKIM y DMARC del subdominio `send.psyconova.com` que Resend necesita.
- **Google Maps** lo carga el navegador del visitante, no Netlify, y sólo tras el
  consentimiento. No hay ninguna otra petición a terceros.

Las funciones se resuelven antes que cualquier regla de archivos estáticos, por eso
`/.netlify/functions/contact` no acaba en el 404.

## `netlify.toml`

📁 [`netlify.toml`](../netlify.toml), en la **raíz** del repositorio (no dentro de
`psyconova-frontend/`).

```toml
[build]
  base = "psyconova-frontend/"
  command = "npm run build"
  publish = "dist/psyconova-frontend/browser/"

[build.environment]
  NODE_VERSION = "24"

[functions]
  directory = "netlify/functions/"
  node_bundler = "esbuild"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "SAMEORIGIN"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=(), …"
    Cross-Origin-Opener-Policy = "same-origin"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
```

Cinco cosas que hay que entender de este archivo:

**1. `base` cambia el punto de partida de todo lo demás.** Como la aplicación no está en la
raíz del repositorio, `base` fija la carpeta de trabajo. A partir de ahí, `publish` y
`functions.directory` se resuelven **relativos a `base`**, no a la raíz. Por eso `publish`
dice `dist/…` y no `psyconova-frontend/dist/…`.

**2. La carpeta publicada es `dist/psyconova-frontend/browser/`**, con `browser/` al final.
Es la estructura que genera el constructor de Angular. Si algún día el sitio se despliega
vacío, esto es lo primero que hay que mirar.

**3. `NODE_VERSION = "24"`** fija la versión de Node con la que compila Netlify, para que sea
la misma con la que se probó en local y la de la integración continua. Además, los scripts
del build importan TypeScript directamente, cosa que Node 24 hace sin configurar nada.

**4. No hay regla comodín de SPA.** El sitio se prerenderiza (`outputMode: "static"` en
`angular.json`), así que cada ruta real tiene su propio archivo generado:
`/` → `index.html`, `/politica-de-privacidad` → `politica-de-privacidad/index.html`, y así.
Una regla que sirviera `index.html` para todo devolvería la portada con código 200 para
cualquier dirección inventada, que para un buscador son infinitas páginas duplicadas. En su
lugar, Netlify sirve automáticamente el `404.html` de la raíz, con código 404 de verdad,
para lo que no encuentre; ese archivo lo genera el `postbuild` a partir de la ruta `/404`
prerenderizada. **Si algún día se añade una ruta que no se prerenderice, habrá que
declararla aquí explícitamente.**

**5. Las cabeceras de seguridad van aquí y no en el HTML** porque varias sólo funcionan
como cabecera real: un `<meta>` equivalente lo ignora el navegador. Cada una lleva su
motivo en un comentario del archivo. Las que conviene tener presentes:

| Cabecera | Qué evita |
|---|---|
| `X-Frame-Options: SAMEORIGIN` | Que otro sitio meta el nuestro en un iframe (clickjacking). No afecta a los iframes que el sitio incrusta |
| `Referrer-Policy: strict-origin-when-cross-origin` | Que al salir del sitio se envíe la ruta completa. El patrón de navegación de alguien en una web de salud mental es un dato sensible |
| `Permissions-Policy` | Que un script inyectado (o el mapa) pida geolocalización, cámara, micrófono… `fullscreen` no se restringe porque el cuento lo usa |
| `Strict-Transport-Security` | HTTPS obligatorio durante un año, subdominios incluidos. Difícil de revertir: el navegador lo recuerda hasta que caduca. Sin `preload` a propósito |

Y las de **caché**: JS y CSS llevan hash en el nombre y se guardan un año (`immutable`);
las fuentes también (no cambian); las imágenes una semana; el HTML se revalida siempre,
porque es lo que apunta a los JS con hash.

### La Content Security Policy

No está en `netlify.toml`: la genera `scripts/generate-csp.mjs` en el `postbuild`, a partir
del HTML **construido**, y la escribe en `dist/…/_headers`. Netlify combina ese archivo con
las cabeceras fijas de `netlify.toml`.

Se genera y no se escribe a mano porque Angular incrusta scripts en línea (los del reemplazo
de eventos y el `onload` del CSS diferido) cuyo contenido cambia entre versiones del
framework. Un hash escrito a mano se quedaría obsoleto en la siguiente actualización y el
sitio dejaría de arrancar, sin que nadie lo notara hasta abrirlo.

Lo esencial de la política: todo `'self'` (scripts, estilos, imágenes, fuentes,
conexiones, destino de formularios); los scripts en línea autorizados por su hash SHA-256;
`frame-src` sólo `maps.google.com` y `www.google.com` (el mapa se carga tras el
consentimiento, pero la CSP tiene que permitirlo de antemano); `frame-ancestors 'self'`;
`object-src 'none'`. El cuento (`/assets/cuentos/*`) tiene su propia política, más cerrada,
con `frame-src 'none'`. La única concesión es `style-src 'unsafe-inline'`, inevitable porque
Angular inyecta los estilos de cada componente en tiempo de ejecución.

Para probar un cambio sin romper nada, `CSP_REPORT_ONLY=1 npm run build` genera la cabecera
en modo informe (`Content-Security-Policy-Report-Only`).

**Si añades cualquier recurso externo** (un iframe, una fuente, una imagen remota, una
API), la CSP lo bloqueará en silencio hasta que lo autorices en el script.

## El ciclo de publicación

1. `git push origin main`.
2. GitHub avisa a Netlify por webhook y, en paralelo, GitHub Actions corre lint, pruebas y
   build.
3. Netlify clona el repositorio, se sitúa en `psyconova-frontend/` y corre `npm install`.
4. `npm run build`: `prebuild` genera `sitemap.xml` y `robots.txt`; Angular compila y
   prerenderiza las cuatro rutas; `postbuild` copia `404.html` y genera la CSP.
5. `esbuild` empaqueta la función `contact`.
6. Publicación en el CDN. **Atómica**: o entra todo, o no entra nada.
7. En dos o tres minutos, el visitante ve el cambio.

Si el build falla en cualquier paso, **el sitio anterior sigue publicado**. Un error de
compilación no tumba el sitio. Y `copy-404.mjs` falla a propósito si la ruta `/404` no se
prerenderizó: es preferible a desplegar sin página de error.

**Cada `push` a `main` publica el sitio.** No hay aprobación manual, ni ambiente de
pruebas, ni rama intermedia. Lo que sí hay son dos redes de seguridad: la integración
continua, que marca el Pull Request en rojo si algo falla, y la **vista previa por cada Pull
Request** que Netlify genera automáticamente (una URL temporal con esa versión del sitio).
Es la forma correcta de revisar un cambio antes de que llegue a producción.

## Variables de entorno

Se configuran en **Netlify → Site configuration → Environment variables**.

| Variable | Obligatoria | Valor |
|---|---|---|
| `RESEND_API_KEY` | **Sí** | La clave de resend.com/api-keys |
| `CONTACT_TO_EMAIL` | No | Por defecto, el correo de `CONTACT_INFO` en `contact.config.ts` |
| `CONTACT_FROM_EMAIL` | No | Por defecto, `PSYCONOVA <hola@send.psyconova.com>` |

⚠️ **Sin `RESEND_API_KEY`, el formulario deja de funcionar.** La función responde 500 y el
visitante ve el mensaje de error con el correo como alternativa. No se pierde la consulta en
silencio, pero se pierde la mayoría de las consultas.

Estas variables **no** están en el repositorio y no deben estarlo nunca. Si necesitas
probarlas en local, ver [07 · Formulario](./07-formulario-de-contacto.md#probar-en-local),
y añade `.env` al `.gitignore` antes.

## Dominio y correo

El dominio `psyconova.com` está en **Squarespace Domains** (que compró el negocio de dominios
de Google). Ahí se gestionan dos cosas distintas:

**1. Que el dominio apunte a Netlify.** Registros A/CNAME según lo que indique el panel de
Netlify.

**2. Que Resend pueda enviar correo desde `@send.psyconova.com`.** Requiere los registros
**SPF, DKIM y DMARC** que Resend proporciona en Domains → Add Domain. Sin ellos, los correos
caen en spam o Resend rechaza el envío. El subdominio `send.` es también el único
subdominio del sitio, y sólo tiene registros de correo; conviene saberlo porque
`Strict-Transport-Security` lleva `includeSubDomains` y cualquier subdominio nuevo tendrá
que servir HTTPS.

Si alguna vez hay que cambiar el remitente, `CONTACT_FROM_EMAIL` lo sobreescribe sin tocar
código.

## Costos y límites

| Servicio | Plan | Límite | Qué pasa al llegar |
|---|---|---|---|
| Netlify | Pro | 3 000 créditos/mes | El sitio se **pausa** si no hay recarga automática |
| Resend | Gratuito | 3 000 correos/mes | Los envíos empiezan a fallar |
| Squarespace | | Renovación anual del dominio | El dominio deja de resolver |
| GitHub Actions | Gratuito para repositorios públicos | Minutos limitados si el repositorio es privado | La CI deja de correr; Netlify sigue publicando |

**Cómo se consumen los créditos de Netlify:** 20 créditos por GB de tráfico y 15 por cada
despliegue a producción.

Un cálculo aproximado: con ~400 KB por visita a la portada (HTML, JavaScript inicial,
fuentes y la primera imagen del portal), 1 GB son unas 2 500 visitas. 3 000 créditos dan
para bastante más de 100 000 visitas al mes descontando los despliegues, con margen de
sobra para el tráfico actual. Aun así, conviene tener presente que **una publicación en
redes que funcione muy bien podría consumirlos**.

⚠️ **Activa la recarga automática de créditos en Netlify.** Sin ella, un pico de visitas
pausa el sitio justo en el momento en que más gente lo está mirando. Es la recomendación
más importante de esta sección.

## Quién es dueño de qué

Esta tabla está incompleta a propósito: **hay que llenarla.**

| Servicio | Cuenta / correo dueño | ¿La titular del sitio tiene acceso? |
|---|---|---|
| GitHub (repositorio `psyconova-frontend`) | | ❓ |
| Netlify | | ❓ |
| Resend | | ❓ |
| Squarespace Domains | | ❓ |
| Google Analytics (si se añade) | | ❓ |

Es la clase de cosa que no importa hasta que importa muchísimo. Si todas las cuentas están a
nombre del desarrollador y el desarrollador deja el proyecto, PSYCONOVA se queda sin acceso
a su propio sitio, sin poder cambiar el dominio ni recuperar el correo. **La titular del
negocio debería ser dueña o administradora de todas las cuentas**, con el desarrollador
invitado como colaborador.

## Operación

### Volver a una versión anterior (rollback)

Netlify guarda cada despliegue. Si una publicación rompe algo:

1. Netlify → **Deploys**.
2. Busca el último despliegue que funcionaba.
3. **Publish deploy**.

Tarda segundos y no requiere tocar Git. Después, arregla el problema en el código con calma.

### Forzar una recompilación sin cambiar código

Netlify → Deploys → **Trigger deploy** → **Clear cache and deploy site**. Útil cuando
sospechas de la caché de dependencias.

### Ver los registros de la función

Netlify → **Functions** → `contact` → **Logs**. Ahí aparecen los `console.error` de la
función, que están escritos para ser legibles:

- `RESEND_API_KEY sin configurar: la consulta no se pudo enviar.`
- `Resend rechazó el envío: <código> <detalle>`
- `No se pudo contactar a Resend: <error>`

### Revisión mensual sugerida

Diez minutos al mes evitan casi todos los fallos silenciosos:

1. **Enviar una consulta de prueba** desde el sitio publicado y confirmar que llega y que no
   cayó en spam.
2. Comprobar el **consumo de créditos** de Netlify.
3. Comprobar el **contador de correos** de Resend.
4. Verificar que el **dominio sigue verificado** en Resend (la verificación puede caerse si
   alguien toca el DNS).
5. Revisar la **fecha de renovación del dominio**.
6. Abrir el sitio publicado con la consola del navegador y comprobar que no hay errores de
   CSP.

## Lista de comprobación antes de publicar

```
[ ] npm run lint                 → sin errores
[ ] npx ng test --watch=false    → 119 pruebas en verde
[ ] npm run build                → "Prerendered 4 static routes", 404.html copiado, CSP generada
[ ] Revisado en la vista previa del Pull Request, en móvil
[ ] Revisado en los dos idiomas (ES y EN)
[ ] Si tocaste textos: las claves existen en es.json Y en en.json
[ ] Si tocaste el menú: la entrada está en navigation.config.ts y su clave nav.* en los dos idiomas
[ ] Si añadiste una página: está en app.routes.ts Y en PAGES (site.config.spec.ts lo comprueba)
[ ] Si añadiste un recurso externo: autorizado en generate-csp.mjs
[ ] Si tocaste el formulario: probado con `netlify dev`
[ ] Ningún dato sensible en el código (claves, correos personales)
```

## Diagnóstico rápido

| Síntoma | Causa más probable | Qué hacer |
|---|---|---|
| El sitio se despliega vacío | `publish` mal configurado | Verifica que sea `dist/psyconova-frontend/browser/` |
| Una ruta nueva da 404 al recargar | No se prerenderizó | Comprueba que esté en `app.routes.ts`, en `PAGES` y que el build diga `Prerendered N static routes` |
| El sitio arranca sin estilos o sin JavaScript | La CSP bloquea algo | Mira la consola del navegador; recompila para regenerar los hashes |
| El mapa o un recurso nuevo no carga | La CSP lo bloquea | Autorízalo en `scripts/generate-csp.mjs` |
| El formulario responde 500 | Falta `RESEND_API_KEY` | Revísala en las variables de entorno |
| Los correos caen en spam o Resend responde 403 | Dominio sin verificar en Resend | Revisa SPF, DKIM y DMARC de `send.psyconova.com` en Squarespace |
| El build falla sólo en Netlify | Versión de Node distinta | Comprueba `NODE_VERSION` y tu `node -v` |
| El build falla en `copy-404` | La ruta `/404` no se prerenderizó | Revisa `app.routes.ts` |
| El sitio está pausado | Créditos agotados | Activa la recarga automática |
| Los cambios no aparecen | Caché del navegador | `Ctrl+Shift+R`; y revisa en Netlify que el deploy pasó |

---

**Siguiente:** [10 · Privacidad y legal](./10-privacidad-y-legal.md): datos personales y
cumplimiento.

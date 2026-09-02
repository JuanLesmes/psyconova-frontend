# 09 · Despliegue y operación

El sitio se aloja en **Netlify** y se publica solo cada vez que se sube algo a `main`.

Este documento explica cómo funciona y qué hacer cuando algo va mal. Complementa a
[`DEPLOY.md`](../DEPLOY.md), que está en la raíz del repositorio y es la guía original de
configuración; aquí se profundiza en la operación del día a día.

## Arquitectura del despliegue

> **📊 GRÁFICO G-23 — Arquitectura de despliegue en Netlify**
> **Va aquí:** justo debajo de este párrafo.
> **Tipo:** diagrama de infraestructura, con una caja grande "Netlify" que contiene dos
> subsistemas.
> **Debe mostrar:** las tres piezas que sirve Netlify y cómo se relacionan con los servicios
> externos.
> **Contenido:**
> - **Izquierda:** `GitHub · Inti-Nova/psyconova-frontend`, rama `main`. Flecha etiquetada
>   "webhook al hacer push" hacia Netlify.
> - **Centro (caja "Netlify"), dos bloques:**
>   - **CDN de archivos estáticos** — sirve `index.html`, `main.js`, `styles.css` y
>     `assets/`. Aquí llega la mayoría del tráfico.
>   - **Funciones serverless** — sólo `contact`. Se ejecuta bajo demanda.
> - **Dentro de la caja de funciones, un candado:** `RESEND_API_KEY`, `CONTACT_TO_EMAIL`,
>   `CONTACT_FROM_EMAIL` (variables de entorno).
> - **Derecha:** `Resend` (recibe la llamada de la función) y `Bandeja de Laura`.
> - **Abajo:** `Squarespace Domains` → apunta `psyconova.com` a Netlify mediante DNS, y
>   además aloja los registros SPF, DKIM y DMARC que Resend necesita.
> - **Arriba a la derecha, aparte:** `Google Fonts` y `Google Maps`, con la nota "los carga
>   el navegador del visitante, no Netlify. El mapa sólo tras el consentimiento."
> **Anota la regla de precedencia:** "Las funciones se resuelven antes que el redirect de
> SPA, por eso `/.netlify/functions/contact` no acaba devolviendo `index.html`."

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

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Cuatro cosas que hay que entender de este archivo:

**1. `base` cambia el punto de partida de todo lo demás.** Como la aplicación no está en la
raíz del repositorio, `base` fija la carpeta de trabajo. A partir de ahí, `publish` y
`functions.directory` se resuelven **relativos a `base`**, no a la raíz. Por eso `publish`
dice `dist/…` y no `psyconova-frontend/dist/…`.

**2. La carpeta publicada es `dist/psyconova-frontend/browser/`**, con `browser/` al final.
Es la estructura que genera el constructor moderno de Angular. Si algún día el sitio se
despliega vacío, esto es lo primero que hay que mirar.

**3. `NODE_VERSION = "24"`** fija la versión de Node con la que compila Netlify, para que sea
la misma con la que se probó en local. El comentario del archivo lo dice: Angular 21
aceptaría también la 22, pero conviene que producción compile con lo mismo que se verificó.

**4. El redirect es lo que hace funcionar la SPA.** Sin él, entrar directamente a
`psyconova.com/politica-de-privacidad` devolvería un 404: en el servidor no existe esa
carpeta. La regla sirve `index.html` para cualquier ruta y deja que el router de Angular
resuelva. El `status = 200` (y no 301) es importante: es una reescritura interna, no una
redirección visible.

Las funciones se resuelven **antes** que los redirects, así que `/.netlify/functions/contact`
no queda atrapado por la regla comodín.

## El ciclo de publicación

> **📊 GRÁFICO G-24 — Línea de tiempo de un despliegue**
> **Va aquí:** debajo de este párrafo.
> **Tipo:** línea de tiempo horizontal con los pasos y sus duraciones.
> **Debe mostrar:** qué pasa desde el `git push` hasta que el visitante ve el cambio.
> **Hitos:**
> - `0 s` — `git push origin main`.
> - `~5 s` — GitHub avisa a Netlify por webhook.
> - `~10 s` — Netlify clona el repositorio y se sitúa en `psyconova-frontend/`.
> - `~60 s` — `npm install` (con caché de Netlify, mucho menos).
> - `~70 s` — `npm run build` (~8 s de compilación real).
> - `~80 s` — `esbuild` empaqueta la función `contact`.
> - `~90 s` — Publicación en el CDN. **Atómica**: o entra todo, o no entra nada.
> - `~2-3 min` — El visitante ve el cambio.
> **Marca en verde, aparte:** "Si el build falla en cualquier paso, **el sitio anterior sigue
> publicado**. Un error de compilación no tumba el sitio."
> **Marca en rojo, aparte:** "No hay ambiente de pruebas. Lo que entra en `main` sale al
> aire."

**Cada `push` a `main` publica el sitio.** No hay aprobación manual, ni ambiente de
pruebas, ni rama intermedia.

Netlify sí genera automáticamente una **vista previa por cada Pull Request** (una URL
temporal con esa versión del sitio). Es la forma correcta de revisar un cambio antes de que
llegue a producción, y hoy está infrautilizada.

El repositorio tiene ahora mismo dos ramas: `main` y `feature/landing-home-base`.

## Variables de entorno

Se configuran en **Netlify → Site configuration → Environment variables**.

| Variable | Obligatoria | Valor |
|---|---|---|
| `RESEND_API_KEY` | **Sí** | La clave de resend.com/api-keys |
| `CONTACT_TO_EMAIL` | No | `laura.lesmes@psyconova.com` (valor por defecto en el código) |
| `CONTACT_FROM_EMAIL` | No | `PSYCONOVA <hola@psyconova.com>` una vez verificado el dominio |

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

**2. Que Resend pueda enviar correo desde `@psyconova.com`.** Requiere crear los registros
**SPF, DKIM y DMARC** que Resend proporciona en Domains → Add Domain. Sin ellos, los correos
salen desde `onboarding@resend.dev` o caen en spam.

La propagación de DNS puede tardar horas. Mientras tanto el sitio funciona: basta con dejar
`CONTACT_FROM_EMAIL` con el remitente de pruebas de Resend.

## Costos y límites

| Servicio | Plan | Límite | Qué pasa al llegar |
|---|---|---|---|
| Netlify | Pro | 3 000 créditos/mes | El sitio se **pausa** si no hay recarga automática |
| Resend | Gratuito | 3 000 correos/mes | Los envíos empiezan a fallar |
| Squarespace | — | Renovación anual del dominio | El dominio deja de resolver |

**Cómo se consumen los créditos de Netlify:** 20 créditos por GB de tráfico y 15 por cada
despliegue a producción.

Un cálculo aproximado: con ~1,2 MB por visita, 1 GB son unas 850 visitas. 3 000 créditos dan
para unas 100 000 visitas al mes descontando los despliegues — margen de sobra para el
tráfico actual, pero conviene tener presente que **una publicación en redes que funcione
muy bien podría consumirlos**.

⚠️ **Activa la recarga automática de créditos en Netlify.** Sin ella, un pico de visitas
pausa el sitio justo en el momento en que más gente lo está mirando. Es la recomendación
que ya está en `DEPLOY.md` y sigue siendo la más importante de esta sección.

Reducir el peso de las imágenes (P-09) baja el consumo de créditos de forma directa.

## Quién es dueño de qué

Esta tabla está incompleta a propósito: **hay que llenarla.**

| Servicio | Cuenta / correo dueño | ¿Laura tiene acceso? |
|---|---|---|
| GitHub (`Inti-Nova/psyconova-frontend`) | — | ❓ |
| Netlify | — | ❓ |
| Resend | — | ❓ |
| Squarespace Domains | — | ❓ |
| Google Analytics (si se añade) | — | ❓ |

Es la clase de cosa que no importa hasta que importa muchísimo. Si todas las cuentas están a
nombre del desarrollador y el desarrollador deja el proyecto, PSYCONOVA se queda sin acceso
a su propio sitio, sin poder cambiar el dominio ni recuperar el correo. **La dueña del
negocio debería ser dueña o administradora de todas las cuentas**, con el desarrollador
invitado como colaborador. Está en las propuestas (P-01).

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

## Lista de comprobación antes de publicar

```
[ ] npm run build          → termina sin errores
[ ] npx ng test --watch=false → 8 pruebas en verde
[ ] Revisado en móvil (o con las herramientas de desarrollo en modo móvil)
[ ] Revisado en los dos idiomas (ES y EN)
[ ] Si tocaste textos: las claves existen en es.json Y en en.json
[ ] Si tocaste el menú: cambiado en navbar.html Y en hero-section.html
[ ] Si tocaste el formulario: probado con `netlify dev`
[ ] Ningún dato sensible en el código (claves, correos personales)
```

## Diagnóstico rápido

| Síntoma | Causa más probable | Qué hacer |
|---|---|---|
| El sitio se despliega vacío | `publish` mal configurado | Verifica que sea `dist/psyconova-frontend/browser/` |
| Recargar una ruta da 404 | Falta el redirect de SPA | Revisa el bloque `[[redirects]]` |
| El formulario responde 500 | Falta `RESEND_API_KEY` | Revísala en las variables de entorno |
| Los correos caen en spam | Dominio sin verificar en Resend | Crea SPF, DKIM y DMARC en Squarespace |
| El build falla sólo en Netlify | Versión de Node distinta | Comprueba `NODE_VERSION` y tu `node -v` |
| El sitio está pausado | Créditos agotados | Activa la recarga automática |
| Los cambios no aparecen | Caché del navegador | `Ctrl+Shift+R`; y revisa en Netlify que el deploy pasó |

---

**Siguiente:** [10 · Privacidad y legal](./10-privacidad-y-legal.md) — datos personales y
cumplimiento.

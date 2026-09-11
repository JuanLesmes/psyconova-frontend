# 12 · Runbook: tareas frecuentes

Recetas paso a paso para los cambios que más se piden. Cada una dice qué archivos tocar, en
qué orden y qué comprobar antes de publicar.

Todos los comandos se corren desde `psyconova-frontend/psyconova-frontend/` (la carpeta
interna).

---

## Contenido y textos

### Cambiar un texto visible

1. Busca la clave en `src/assets/i18n/es.json`. Si no sabes cuál es, busca el texto actual
   dentro de ese archivo.
2. Cámbialo.
3. **Cambia la misma clave en `en.json`.**
4. Verifica en el navegador con el selector `ES / EN`.

Si el texto no aparece en los archivos de idioma, es una de las cuatro excepciones (dato de
contacto, documento legal, página 404 o el cuento). Ver
[06 · Internacionalización](./06-internacionalizacion.md#las-cuatro-excepciones).

### Cambiar el teléfono, el correo o la dirección

Un solo archivo: `src/app/core/config/contact.config.ts`.

```ts
export const CONTACT_INFO = {
  whatsapp: '+57 305 373 2503',
  whatsappLink: 'https://wa.me/573053732503',   // ← sin espacios ni signos
  email: 'laura.lesmes@psyconova.com',
};
```

⚠️ Si cambias el WhatsApp, cambia **los dos campos**. `whatsappLink` debe llevar el número
sin espacios, sin `+` y sin guiones: es lo que exige `wa.me`.

Si cambias el correo, el destino de las consultas cambia solo: la función serverless toma
por defecto `CONTACT_INFO.email`. Si en Netlify hay definida la variable
`CONTACT_TO_EMAIL`, esa manda; revísala o bórrala.

Comprueba después: el enlace de WhatsApp en la sección de contacto, el correo en esa misma
sección, el correo del footer y, en la política de privacidad, el correo del responsable
(sección 1), que va escrito en el texto.

### Cambiar la dirección del mapa

En `contact.config.ts`:

```ts
export const LOCATION = {
  street: 'Carrera 13 #90-20',
  building: 'Edificio Professional Bureau',
  city: 'Bogotá, Colombia',
  get query(): string { return `${this.street}, ${this.city}`; },
  zoom: 17,
};
```

Después de cambiarla, **acepta el mapa en el navegador y comprueba que el marcador cae donde
debe**. El geocodificador de Google no siempre acierta; si falla, ajusta `query` para que
devuelva un objeto con la forma correcta. La ficha de negocio (`Home`) y la política de
privacidad también muestran la dirección: la primera la toma de aquí, la segunda la lleva
escrita en el texto.

### Cambiar el horario de atención

Es texto traducido: clave `contact.info.scheduleValue` en `es.json` y `en.json`.

### Actualizar las líneas de crisis

⚠️ **Verifica primero contra la fuente oficial** (minsalud.gov.co, saludcapital.gov.co). Un
número equivocado en una línea de crisis es peor que no tener ninguna.

1. Cambia el número en `CRISIS_LINES` (`contact.config.ts`) y actualiza la fecha de
   verificación en el comentario de arriba.
2. Si cambia también la descripción, es texto traducido: `contact.crisis.lines.<key>` en los
   dos archivos de idioma.
3. Cambia los mismos números en `features/not-found/not-found.html`, donde van escritos en
   el texto.
4. Llama al número desde un teléfono antes de publicar.

---

## Secciones y estructura

### Reordenar las secciones de la portada

Un solo archivo: `src/app/features/home/pages/home/home.html`. Reordena las etiquetas.

⚠️ Revisa después el **ritmo claro-oscuro**: hoy las dos secciones oscuras (Servicios y
Cuentos) van seguidas. Si al reordenar quedan dos claras pegadas sin separación visual, hay
que ajustar los degradados. Ver [04 · Sistema de diseño](./04-sistema-de-diseno.md#ritmo-claro-oscuro).
Y mantén el `@defer (hydrate on viewport)` sólo en las secciones que queden por debajo de la
primera pantalla.

### Añadir un servicio a la sección de Servicios

1. En `services-section.ts`, añade la entrada:
   ```ts
   { num: '04', key: 'nuevoServicio', accent: 'teal' },
   ```
   El acento sólo puede ser `'teal'`, `'purple'` o `'indigo'`.

2. En `es.json` y `en.json`, añade bajo `services.cards`:
   ```json
   "nuevoServicio": { "label": "…", "title": "…", "desc": "…" }
   ```

3. Revisa la cuadrícula en móvil: está pensada para tres tarjetas y una cuarta puede quedar
   suelta en la segunda fila.

### Añadir una entrada al menú

Un solo archivo: `src/app/core/config/navigation.config.ts`. Las dos barras (la fija y la
de la portada) y el panel del menú leen de ahí.

```ts
export const MENU_LINKS = [
  …
  { fragment: 'mi-ancla', key: 'nav.miEntrada' },
] as const;
```

Y añade `nav.miEntrada` en los dos archivos de idioma.

⚠️ Comprueba que el `fragment` coincide **exactamente** con el `id` de la sección de la
portada. Si no coincide, el enlace no lleva a ninguna parte y nada avisa.

### Añadir una sección nueva a la portada

Ver la receta completa en
[04 · Sistema de diseño](./04-sistema-de-diseno.md#cómo-añadir-una-sección-nueva).

### Añadir una página nueva (una ruta)

Las páginas del sitio están descritas en dos sitios que tienen que coincidir, y una prueba
lo vigila:

1. Crea el componente en `features/mi-pagina/` y llama a `SeoService.apply(PAGES.miPagina)`
   en su `ngOnInit`.
2. En `app.routes.ts`, añade la ruta con `loadComponent`, antes del comodín `**`.
3. En `site.config.ts`, añade la entrada a `PAGES` con título, descripción y ruta. Si no
   debe indexarse, `noindex: true` (la deja también fuera del sitemap).
4. `npx ng test --watch=false`: `site.config.spec.ts` comprueba que el router y `PAGES`
   dicen lo mismo.
5. `npm run build`: el número de `Prerendered N static routes` debe subir en uno.

Si la página tiene texto visible, va en i18n como todo lo demás, salvo que sea un documento
legal.

Las secciones "Entornos VR" y "Equipo interdisciplinario" no existen en el sitio; cualquier
ampliación en ese sentido se haría como sección nueva siguiendo la receta de arriba.

---

## Imágenes

### Añadir o reemplazar una imagen

Los originales viven en `design/source-images/`, **fuera de Git**, en tu disco. Si no los
tienes, pídelos a quien mantuvo el proyecto antes de empezar.

1. Deja el original (PNG o JPEG a resolución completa) en la carpeta correspondiente de
   `design/source-images/`.
2. Ejecuta:
   ```bash
   npm run optimize:images
   ```
3. Comprueba el resultado en `src/assets/images/`. Ese WebP es lo que se versiona y se
   publica.
4. Referéncialo desde el componente como `assets/images/…` (sin barra inicial), con
   `width` y `height`.
5. Ponle un `alt`. Si es contenido, tradúcelo en los dos archivos de idioma.

⚠️ **No edites los archivos de `src/assets/images/` a mano**: la siguiente ejecución del
script los sobrescribe.

### Añadir una foto de persona con encuadre correcto

Las fotos del equipo necesitan recorte manual, porque el automático deja la cara fuera de
cuadro.

1. Deja el original en `design/source-images/team/`.
2. Abre el original y anota las coordenadas del encuadre que quieres, **en píxeles del
   original**.
3. En `scripts/optimize-images.mjs`, dentro del trabajo `team`, añade la entrada. La clave
   es el nombre del archivo **sin extensión**:
   ```js
   recortes: {
     'laura':   { left: 934, top: 1280, width: 1285, height: 1680 },
     'nombre':  { left: …,   top: …,    width: …,    height: … },
   },
   ```
4. **La proporción debe ser 520/680 = 0,765.** Es decir, `width / height ≈ 0.765`.
5. Ejecuta el script y mira el resultado. `top` baja el encuadre; reducir `height` acerca.
   Repite hasta que quede bien.

### Cambiar el logo

Todo el sitio usa **un solo archivo**: `assets/images/branding/logoClaroConLetrasSinFondo.webp`,
en la barra de menú, el footer, la pantalla de carga, la ficha de negocio y la imagen para
redes.

1. Deja el nuevo PNG en `design/source-images/branding/` con el mismo nombre.
2. `npm run optimize:images`.
3. `node scripts/social-image.mjs`, para que la imagen que muestran WhatsApp y LinkedIn
   lleve el logo nuevo.
4. Revisa los sitios donde aparece, sobre fondo claro **y** sobre fondo oscuro.

### Cambiar el favicon y los iconos

1. Reemplaza `design/faviconPsyconova-original.png` (en tu disco) por el original nuevo.
2. `node scripts/generate-icons.mjs`: escribe `favicon-32.png`, `apple-touch-icon.png` e
   `icon-192.png` en `src/assets/icons/`.
3. En `index.html`, **sube el número de versión** de los tres `<link>` (`?v=4` → `?v=5`)
   para que los navegadores descarten el que tienen en caché.

### Regenerar las fuentes

Sólo hace falta si cambian las familias o los pesos. Edita `URL_CSS` en
`scripts/download-fonts.mjs` y corre `npm run fonts:download`: descarga los woff2 a
`src/assets/fonts/` y reescribe `src/styles/_fonts.scss`. Si cambia la familia, actualiza
también la precarga de `index.html` y renombra los archivos: Netlify los sirve con caché de
un año.

---

## Cuentos

### Actualizar el cuento existente

Reemplaza `src/assets/cuentos/las-manadas.html`. Es un archivo autónomo: no hay que compilar
nada ni tocar código de Angular. La Content Security Policy autoriza su script en línea por
su hash, que se recalcula en cada build, así que basta con desplegar.

Compruébalo después dentro del iframe de la sección de Cuentos **y** abriéndolo directamente
en `/assets/cuentos/las-manadas.html`. Si el cuento no arranca en el sitio publicado pero
sí en local, mira la consola: es la CSP.

### Cambiar la palabra clave

En `src/app/core/config/tales.config.ts`:

```ts
codes: ['manada', 'las manadas'],
```

Puedes poner varias. Se comparan sin tildes, sin distinguir mayúsculas y colapsando espacios,
así que no hace falta añadir variantes de escritura. Corre las pruebas después:
`tales.config.spec.ts` comprueba que todas las palabras configuradas se aceptan a sí mismas.

⚠️ Recuerda: **esto no protege el cuento de verdad.** Cualquiera puede abrir el archivo
directamente por su URL. Sirve para que el cuento se entregue en consulta, no para impedir
el acceso.

### Añadir un segundo cuento

No es sólo poner el archivo. Hay que cambiar:

1. `tales.config.ts`: hoy `TALE` es un objeto único; hay que convertirlo en una lista con
   su propia palabra clave por cuento.
2. `stories-section.ts` y `.html`: hoy muestran un cuento fijo; hay que recorrer la lista.
3. Los archivos de idioma: hoy `stories.tale` describe un cuento concreto; habría que
   anidarlo por cuento.

Es trabajo de una tarde, pero es trabajo. `robots.txt` ya deja fuera del índice toda la
carpeta `/assets/cuentos/`, así que el archivo nuevo queda cubierto.

---

## Documentos legales

### Publicar la versión definitiva tras la validación jurídica

1. Reemplaza el texto en `features/legal/pages/privacy-policy/privacy-policy.html` y en
   `terms-of-use/terms-of-use.html`.
2. **Quita el bloque del aviso de borrador en los dos archivos**, incluido el comentario
   `<!-- AVISO DE BORRADOR … -->`. Es el bloque `<div class="legal__draft">`. Los estilos
   `.legal__draft` de `legal.scss` pueden quitarse entonces también.
3. Actualiza la fecha de "Última actualización" en los dos.
4. Comprueba que los enlaces del footer y del consentimiento del formulario siguen
   funcionando.

### Actualizar la política tras un cambio en el sitio

Revisa la lista de comprobación de
[10 · Privacidad y legal](./10-privacidad-y-legal.md#lista-de-comprobación-de-privacidad).
Y si cambió el texto del consentimiento del mapa de forma sustancial, sube la versión de la
clave en `contact.config.ts`:

```ts
export const MAP_CONSENT_KEY = 'psyconova.mapConsent.v2';   // era v1
```

Eso hace que se vuelva a pedir permiso a quienes ya lo habían dado sobre el texto anterior.
`consent.spec.ts` comprueba que la clave lleva versión.

---

## Operación

### Cambiar el destino de las consultas

Lo normal es cambiar el correo en `contact.config.ts` (receta de arriba): la función lo
toma de ahí. Si hace falta un destino distinto del correo público, define
`CONTACT_TO_EMAIL` en Netlify → Site configuration → Environment variables.

**No hace falta desplegar de nuevo** para que la función lea una variable nueva, pero es
más seguro forzar un despliegue después y enviar una consulta de prueba.

### Cambiar de proveedor de correo

La separación está pensada para esto. Dos casos:

**Si el proveedor nuevo también recibe un `POST` en una URL propia** (por ejemplo
Web3Forms): cambia `CONTACT_ENDPOINT` en `contact.config.ts` y autoriza ese dominio en
`connect-src` dentro de `scripts/generate-csp.mjs`. Ni el componente ni el servicio se
enteran.

**Si quieres seguir usando la función serverless pero con otro servicio de correo**: cambia
`RESEND_ENDPOINT` y el cuerpo de la petición dentro de `contact.mts`. El resto (validaciones,
campo trampa, escape) vive en `contact-rules.ts` y sigue igual.

### Cambiar el dominio

Una sola constante: `SITE.url` en `src/app/core/config/site.config.ts`. De ahí salen el
canonical, las etiquetas Open Graph, la ficha de negocio, `sitemap.xml` y `robots.txt`.
Después: el dominio en Netlify, los DNS en el registrador y el dominio de envío en Resend.

### Comprobar que el formulario funciona

```bash
# Desde el sitio publicado: llena el formulario y envía.
# Después confirma tres cosas:
#   1. El correo llegó al buzón de contacto
#   2. NO cayó en spam
#   3. Al responder ese correo, la respuesta va al visitante (reply_to)
```

Hazlo **al menos una vez al mes**. Es el único fallo del sitio que no da ninguna señal.

### Volver a una versión anterior

Netlify → Deploys → busca el último despliegue bueno → **Publish deploy**. Segundos, sin
tocar Git.

### Ver por qué falla el formulario

Netlify → Functions → `contact` → Logs. Los mensajes están escritos para leerse; ver el
diagnóstico completo en
[07 · Formulario](./07-formulario-de-contacto.md#qué-revisar-si-dejan-de-llegar-consultas).

### Añadir un recurso externo (iframe, API, imagen remota)

La Content Security Policy bloquea todo lo que no sea del propio dominio, en silencio.
Antes de dar por roto algo nuevo:

1. Abre la consola del navegador: los bloqueos de CSP aparecen ahí.
2. Autoriza el dominio en la directiva que toque (`frame-src`, `connect-src`, `img-src`…)
   dentro de `scripts/generate-csp.mjs`.
3. Si el recurso instala cookies o recibe la IP del visitante, necesita consentimiento
   previo como el mapa, y una línea en la política de privacidad.

---

## Mantenimiento del código

### Actualizar dependencias

```bash
npx ng update                             # ver qué hay disponible
npx ng update @angular/core @angular/cli  # actualizar Angular
npm outdated                              # el resto
```

Después de cualquier actualización: `npm run lint`, `npx ng test --watch=false`,
`npm run build`, y una revisión visual completa del sitio en móvil y escritorio. Angular
tiene migraciones automáticas para casi todo, pero el CSS a mano de este proyecto no está
cubierto por ellas. La CSP se regenera sola en el build, así que un cambio en los scripts
en línea de Angular no la deja obsoleta.

### Arreglar el aviso de presupuesto de `cta-section.scss`

El archivo pesa 10,85 kB compilado y el límite de aviso está en 10 kB. Dos caminos:

**Reducir el archivo.** Es la sección más grande del sitio (aviso de crisis, formulario,
tarjetas, mapa con sus tres estados). Se puede partir en componentes más pequeños, cada uno
con su hoja.

**Subir el límite.** En `angular.json`, `budgets` → `anyComponentStyle` →
`maximumWarning`. Es legítimo si se decide que 10 kB es un límite demasiado bajo para las
secciones de este sitio, pero entonces súbelo con criterio, no hasta que deje de avisar.

### Comprobar que los dos idiomas están completos

```bash
node -e "const es=require('./src/assets/i18n/es.json'),en=require('./src/assets/i18n/en.json');const f=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?f(v,p+k+'.'):[p+k]);const a=f(es),b=f(en);console.log('es:',a.length,'en:',b.length);console.log('faltan en en:',a.filter(k=>!b.includes(k)));console.log('sobran en en:',b.filter(k=>!a.includes(k)));"
```

Debe decir `147` y `147`, con las dos listas vacías.

---

## Antes de publicar cualquier cosa

```
[ ] npm run lint                 → sin errores
[ ] npx ng test --watch=false    → 119 pruebas en verde
[ ] npm run build                → sin errores, "Prerendered 4 static routes", 404 copiado, CSP generada
[ ] Revisado en la vista previa del PR, en móvil
[ ] Revisado en ES y en EN
[ ] Si tocaste el menú: navigation.config.ts y la clave nav.* en los dos idiomas
[ ] Si tocaste textos: claves en es.json Y en.json
[ ] Si añadiste algo externo: autorizado en la CSP
[ ] Ninguna clave ni dato sensible en el código
```

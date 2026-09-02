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

Si el texto no aparece en los archivos de idioma, es una de las tres excepciones (dato de
contacto, documento legal o el cuento). Ver
[06 · Internacionalización](./06-internacionalizacion.md#las-tres-excepciones).

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

Si cambias el correo, cambia también `CONTACT_TO_EMAIL` en las variables de entorno de
Netlify, o las consultas seguirán llegando a la dirección anterior.

Comprueba después: el enlace de WhatsApp en la sección de contacto, el correo en esa misma
sección y el correo del footer.

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
devuelva un objeto con la forma correcta.

### Cambiar el horario de atención

Es texto traducido: clave `contact.info.scheduleValue` en `es.json` y `en.json`.

### Actualizar las líneas de crisis

⚠️ **Verifica primero contra la fuente oficial** (minsalud.gov.co, saludcapital.gov.co). Un
número equivocado en una línea de crisis es peor que no tener ninguna.

1. Cambia el número en `CRISIS_LINES` (`contact.config.ts`) y actualiza la fecha de
   verificación en el comentario de arriba.
2. Si cambia también la descripción, es texto traducido: `contact.crisis.lines.<key>` en los
   dos archivos de idioma.
3. Llama al número desde un teléfono antes de publicar.

---

## Secciones y estructura

### Reordenar las secciones de la portada

Un solo archivo: `src/app/features/home/pages/home/home.html`. Reordena las etiquetas.

⚠️ Revisa después el **ritmo claro-oscuro**: hoy las dos secciones oscuras (Servicios y
Cuentos) van seguidas. Si al reordenar quedan dos claras pegadas sin separación visual, hay
que ajustar los degradados. Ver [04 · Sistema de diseño](./04-sistema-de-diseno.md#ritmo-claro-oscuro).

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

⚠️ **Hay dos menús duplicados.** Tienes que tocar los dos:

- `src/app/layout/components/navbar/navbar.html`
- `src/app/features/home/components/hero-section/hero-section.html`

Si la sección está en la portada, usa un ancla:

```html
<a routerLink="/" fragment="mi-ancla" (click)="closeMenu()">{{ 'nav.miEntrada' | translate }}</a>
```

Y añade `nav.miEntrada` en los dos archivos de idioma.

⚠️ Comprueba que el `fragment` coincide **exactamente** con el `id` de la sección. Es el
error que ya existe hoy: el enlace "Nosotros" apunta a `intro` y la sección tiene
`id="nosotros"`.

### Añadir una sección nueva a la portada

Ver la receta completa en
[04 · Sistema de diseño](./04-sistema-de-diseno.md#cómo-añadir-una-sección-nueva).

### Activar la galería de entornos VR

1. En `services-section.ts`, descomenta la interfaz `VrEnv` y el array `environments`.
2. En `services-section.html`, descomenta el bloque "Entornos VR".
3. **Mueve los `label` a los archivos de idioma** bajo `services.environments` — el
   comentario del código deja esa instrucción expresamente.
4. Añade las imágenes siguiendo la receta de abajo y rellena los campos `img`.

### Activar el equipo interdisciplinario

1. En `team-section.ts`, descomenta la interfaz `TeamMember` y el array `team`.
2. En `team-section.html`, descomenta el bloque "Equipo interdisciplinario".
3. ⚠️ **Reemplaza los nombres de relleno.** En `es.json` y `en.json`, bajo `team.members`,
   hay "Nombre del Líder", "Nombre del Asesor" y "Nombre del Estratega". Si se publica sin
   cambiarlos, esos textos salen al aire.
4. Añade las fotos con recorte manual, siguiendo la receta de abajo.

---

## Imágenes

### Añadir o reemplazar una imagen

1. Deja el original (PNG o JPEG a resolución completa) en la carpeta correspondiente de
   `design/source-images/`.
2. Ejecuta:
   ```bash
   npm run optimize:images
   ```
3. Comprueba el resultado en `src/assets/images/`.
4. Referéncialo desde el componente como `assets/images/…` (sin barra inicial).
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
en el navbar, el hero, el footer y la pantalla de carga.

1. Deja el nuevo PNG en `design/source-images/branding/` con el mismo nombre.
2. `npm run optimize:images`.
3. Revisa los cuatro sitios donde aparece, sobre fondo claro **y** sobre fondo oscuro.

### Cambiar el favicon

1. Reemplaza `src/assets/icons/faviconPsyconova.png`.
2. En `index.html`, **sube el número de versión** para que los navegadores descarten el que
   tienen en caché:
   ```html
   <link rel="icon" type="image/png" sizes="32x32" href="assets/icons/faviconPsyconova.png?v=4">
   ```
3. Aprovecha para arreglar los dos defectos que tiene hoy: el archivo pesa 124 KB (debería
   pesar 1-2 KB) y el atributo dice `sizes="32x40"`, que no es un tamaño válido.

---

## Cuentos

### Actualizar el cuento existente

Reemplaza `src/assets/cuentos/las-manadas.html`. Es un archivo autónomo: no hay que compilar
nada ni tocar código de Angular.

Compruébalo después dentro del iframe de la sección de Cuentos **y** abriéndolo directamente
en `/assets/cuentos/las-manadas.html`.

### Cambiar la palabra clave

En `src/app/core/config/tales.config.ts`:

```ts
codes: ['manada', 'las manadas'],
```

Puedes poner varias. Se comparan sin tildes, sin distinguir mayúsculas y colapsando espacios,
así que no hace falta añadir variantes de escritura.

⚠️ Recuerda: **esto no protege el cuento de verdad.** Cualquiera puede abrir el archivo
directamente por su URL. Sirve para que el cuento se entregue en consulta, no para impedir
el acceso.

### Añadir un segundo cuento

No es sólo poner el archivo. Hay que cambiar:

1. `tales.config.ts` — hoy `TALE` es un objeto único; hay que convertirlo en una lista con
   su propia palabra clave por cuento.
2. `stories-section.ts` y `.html` — hoy muestran un cuento fijo; hay que recorrer la lista.
3. Los archivos de idioma — hoy `stories.tale` describe un cuento concreto; habría que
   anidarlo por cuento.

Es trabajo de una tarde, pero es trabajo.

---

## Documentos legales

### Publicar la versión definitiva tras la validación jurídica

1. Reemplaza el texto en `features/legal/pages/privacy-policy/privacy-policy.html` y en
   `terms-of-use/terms-of-use.html`.
2. **Quita el bloque del aviso de borrador en los dos archivos**, incluido el comentario
   `<!-- AVISO DE BORRADOR … -->`. Es el bloque `<div class="legal__draft">`.
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

---

## Operación

### Cambiar el destino de las consultas

En Netlify → Site configuration → Environment variables → `CONTACT_TO_EMAIL`.

**No hace falta desplegar de nuevo** para las funciones, pero es más seguro forzar un
despliegue después y enviar una consulta de prueba.

### Cambiar de proveedor de correo

La separación está pensada para esto. Dos casos:

**Si el proveedor nuevo también recibe un `POST` en una URL propia** (por ejemplo
Web3Forms): cambia `CONTACT_ENDPOINT` en `contact.config.ts`. Ni el componente ni el
servicio se enteran.

**Si quieres seguir usando la función serverless pero con otro servicio de correo**: cambia
`RESEND_ENDPOINT` y el cuerpo de la petición dentro de `contact.mts`. El resto de la
función (validaciones, campo trampa, escape) sigue igual.

### Comprobar que el formulario funciona

```bash
# Desde el sitio publicado: llena el formulario y envía.
# Después confirma tres cosas:
#   1. El correo llegó a laura.lesmes@psyconova.com
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

---

## Mantenimiento del código

### Actualizar dependencias

```bash
npx ng update                             # ver qué hay disponible
npx ng update @angular/core @angular/cli  # actualizar Angular
npm outdated                              # el resto
```

Después de cualquier actualización: `npm run build`, `npx ng test --watch=false`, y una
revisión visual completa del sitio en móvil y escritorio. Angular tiene migraciones
automáticas para casi todo, pero el CSS a mano de este proyecto no está cubierto por ellas.

### Arreglar el aviso de presupuesto de `cta-section.scss`

El archivo pesa 10,38 kB y el límite de aviso está en 10 kB. Dos caminos:

**Reducir el archivo** — Es la sección más grande del sitio (aviso de crisis, formulario,
tarjetas, mapa). Se puede partir en componentes más pequeños, cada uno con su hoja.

**Subir el límite** — En `angular.json`, `budgets` → `anyComponentStyle` →
`maximumWarning`. Es legítimo si se decide que 10 kB es un límite demasiado bajo para las
secciones de este sitio, pero entonces súbelo con criterio, no hasta que deje de avisar.

### Comprobar que los dos idiomas están completos

```bash
node -e "const es=require('./src/assets/i18n/es.json'),en=require('./src/assets/i18n/en.json');const f=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?f(v,p+k+'.'):[p+k]);const a=f(es),b=f(en);console.log('es:',a.length,'en:',b.length);console.log('faltan en en:',a.filter(k=>!b.includes(k)));console.log('sobran en en:',b.filter(k=>!a.includes(k)));"
```

Debe decir `155` y `155`, con las dos listas vacías.

---

## Antes de publicar cualquier cosa

```
[ ] npm run build                → sin errores
[ ] npx ng test --watch=false    → 8 pruebas en verde
[ ] Revisado en móvil
[ ] Revisado en ES y en EN
[ ] Si tocaste el menú: cambiado en navbar.html Y hero-section.html
[ ] Si tocaste textos: claves en es.json Y en.json
[ ] Ninguna clave ni dato sensible en el código
```

---

**Siguiente:** [PROPUESTAS.md](./PROPUESTAS.md) — recomendaciones para presentar a la dueña.

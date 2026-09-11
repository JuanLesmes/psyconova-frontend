# 06 · Internacionalización

El sitio está en español e inglés. El español es el idioma por defecto, el de respaldo y
el idioma con el que se prerenderizan todas las páginas.

## La regla

**Todo texto que el visitante lee va en `assets/i18n/es.json` y `assets/i18n/en.json`.
Nunca escrito directamente en una plantilla.**

Hay cuatro excepciones, todas justificadas, y están al final de este documento.

## Cómo funciona

El sistema es [`@ngx-translate`](https://github.com/ngx-translate/core). La configuración
completa está en `app.config.ts`:

```ts
provideTranslateService({
  loader: provideTranslateHttpLoader({
    prefix: 'assets/i18n/',
    suffix: '.json',
  }),
  fallbackLang: 'es',
  lang: toTranslateCode(DEFAULT_LANGUAGE),
})
```

- `prefix` + código de idioma + `suffix` forma la URL: `assets/i18n/es.json`.
- `fallbackLang: 'es'`: si una clave falta en inglés, se usa la española.
- `lang`: siempre español al arrancar. La configuración se construye también al
  prerenderizar, donde no hay `localStorage` ni `navigator`; `LanguageService` cambia al
  idioma guardado ya en el navegador, después de hidratar, para que el primer render
  coincida con el HTML generado y no haya salto. Ver
  [05 · Catálogo](./05-catalogo-de-componentes.md#languageservice).

El recorrido de un texto: la plantilla pide `{{ 'hero.subtitle' | translate }}`; el pipe
pregunta a `TranslateService`; si el diccionario del idioma activo no está cargado,
`TranslateHttpLoader` lo descarga (una sola vez por idioma y sesión); se busca `hero` →
`subtitle` en el objeto anidado; si la clave no existe, se intenta en el idioma de
respaldo; y si tampoco, **se muestra la clave literal en pantalla**. Así es exactamente
como se ve un error de traducción.

Los archivos se descargan por HTTP en tiempo de ejecución, no se empaquetan en el
JavaScript. El HTML prerenderizado ya trae los textos en español; el JSON se pide al
hidratar (`provideHttpClient(withFetch())` existe porque el cargador también los pide
durante la generación del HTML).

## Estructura de los archivos

Objetos anidados que reflejan las secciones del sitio:

```json
{
  "nav":      { "home": "Inicio", "services": "Servicios", "skipToContent": "…", "menuLabel": "…", … },
  "loading":  { "tagline": "…" },
  "hero":     { "titleBefore": "…", "titleAccent": "…", … },
  "intro":    { "title": "…", "nodes": { "problema": { "tag": "…", … } } },
  "services": { "badge": "…", "cards": { "personal": { … } } },
  "stories":  { "badge": "…", "tale": { … }, "gate": { … }, "unlocked": { … } },
  "team":     { "badge": "…", "lead": { … }, "stats": { … } },
  "contact":  { "badge": "…", "crisis": { … }, "form": { … }, "map": { … } },
  "footer":   { "tagline": "…", … }
}
```

**Los dos archivos tienen exactamente 147 claves cada uno y coinciden al cien por cien.**
Mantenlo así.

Para comprobarlo en cualquier momento, desde `psyconova-frontend/`:

```bash
node -e "const es=require('./src/assets/i18n/es.json'),en=require('./src/assets/i18n/en.json');const f=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?f(v,p+k+'.'):[p+k]);const a=f(es),b=f(en);console.log('es:',a.length,'en:',b.length);console.log('faltan en en:',a.filter(k=>!b.includes(k)));console.log('sobran en en:',b.filter(k=>!a.includes(k)));"
```

Si `faltan en en` no está vacío, hay claves sin traducir que en inglés se mostrarán en
español.

## Cómo se usan las claves

**En una plantilla, lo normal:**

```html
<h2>{{ 'services.title' | translate }}</h2>
```

**En un atributo:**

```html
<button [attr.aria-label]="'nav.openMenu' | translate">
<img [alt]="'intro.loop.start' | translate">
```

**Componiendo la clave a partir de datos**: es el patrón más usado del proyecto:

```html
<!-- s.key vale 'personal', 'professional' o 'selfKnowledge' -->
<h3>{{ 'services.cards.' + s.key + '.title' | translate }}</h3>
```

Así el TypeScript guarda sólo `key: 'personal'` y ningún texto. Lo usan
`ServicesSection`, `TeamSection`, `IntroSection`, las líneas de crisis de `CtaSection` y
las entradas del menú (`MENU_LINKS` guarda `key: 'nav.home'`).

**Eligiendo entre dos claves según el estado:**

```html
{{ (isSending() ? 'contact.form.sending' : 'contact.form.submit') | translate }}
```

**En TypeScript** (no se usa hoy, pero si lo necesitas):

```ts
private readonly translate = inject(TranslateService);
const texto = this.translate.instant('contact.success');   // síncrono
this.translate.get('contact.success').subscribe(t => …);   // asíncrono, más seguro
```

Prefiere `get()`. `instant()` devuelve la clave si el diccionario todavía no ha cargado.

## Sobre `innerHTML`

Tres títulos llevan un `<br>` dentro del texto traducido para controlar dónde parte la
línea:

```json
"title": "Realidad virtual<br>para el bienestar"
```

Y se pintan así:

```html
<h2 class="svc-title" [innerHTML]="'services.title' | translate"></h2>
```

Son los títulos de Servicios, Cuentos y Equipo.

**¿Es seguro?** Sí, en este caso. Angular sanea el contenido de `[innerHTML]`, así que
aunque alguien metiera un `<script>` en el JSON, no se ejecutaría. Y además el contenido de
los archivos de idioma lo escribimos nosotros, no viene de fuera.

**Pero úsalo sólo para eso.** Si necesitas un `<br>`, adelante. Si necesitas negritas o
enlaces dentro de un texto traducido, es mejor partir el texto en varias claves, como hace
el hero con `titleBefore` / `titleAccent` / `titleAfter`.

## Añadir un texto nuevo

1. Elige la clave siguiendo la sección donde vive: `services.cards.nuevo.title`.
2. Añádela en `es.json`.
3. Añádela en `en.json`, **en la misma posición del árbol**.
4. Úsala en la plantilla con el pipe.
5. Comprueba los dos idiomas con el selector `ES / EN`.

Si ves la clave literal en pantalla (`services.cards.nuevo.title` en vez del texto), es que
está mal escrita o falta en ese idioma.

## Añadir un idioma nuevo

Supongamos portugués:

1. Copia `es.json` a `pt.json` y tradúcelo entero.
2. En `language.service.ts`, añade el código a la lista:
   ```ts
   export const LANGUAGES = ['ES', 'EN', 'PT'] as const;
   ```

Y ya. El tipo `Language` se deriva de esa constante, el selector de idioma (`MenuBar`, el
mismo componente en la barra fija y en la portada) recorre `languages` con `@for`, y
`toTranslateCode()` sólo pasa a minúsculas. **No hay que tocar ninguna plantilla.**

Dos cosas a revisar después:
- El selector muestra el código de dos letras. Con tres o más idiomas, la fila puede
  quedar apretada en móvil.
- Los documentos legales y la página 404 seguirían sólo en español (ver más abajo).

## Las cuatro excepciones

Hay texto visible que **no** está en los archivos de idioma. Las cuatro tienen motivo:

**1. Datos de contacto.** Teléfonos, correo, dirección, números de las líneas de crisis.
Están en `core/config/contact.config.ts`. Un número de teléfono es el mismo en cualquier
idioma; tenerlo duplicado en dos archivos sólo crea la posibilidad de que diverjan.

**2. Documentos legales.** La política de privacidad y los términos de uso tienen el texto
directamente en su plantilla. El motivo, del propio código:

> *"Es un documento legal regido por la ley colombiana, así que su versión vinculante es la
> española. Traducirlo crearía dos textos que podrían decir cosas distintas."*

Si algún día se traducen, la traducción debe llevar una nota de que la versión vinculante es
la española.

**3. El cuento interactivo.** `assets/cuentos/las-manadas.html` es un archivo autónomo con
su propio HTML, CSS y JavaScript. Está sólo en español y no participa del sistema de
traducción.

**4. La página 404.** Su texto (título, explicación, botones y aviso de crisis) va directo
en `not-found.html`, sólo en español.

En resumen, para decidir dónde va un texto nuevo: si el visitante no lo lee, no se traduce;
si es un dato de contacto, `contact.config.ts`; si es un documento legal o la página 404,
directo en la plantilla; si está dentro del cuento, en el propio archivo; y en cualquier
otro caso, que es el 95 % de las veces, **en `es.json` y `en.json`**.

## Limitaciones actuales

Cosas que hoy no hace el sistema y que conviene conocer:

**El idioma no está en la URL.** Cambiar a inglés no cambia la dirección: sigue siendo
`psyconova.com/`. Consecuencias: no se puede compartir un enlace en inglés, y los buscadores
sólo indexan la versión española, que es la que se prerenderiza. Resolverlo requiere rutas
por idioma (`/es/`, `/en/`) más etiquetas `hreflang`.

**No hay plurales ni interpolación.** `ngx-translate` los soporta
(`"Tienes {{n}} mensajes"`), pero el sitio no lo necesita hoy.

**No hay comprobación automática de que los dos archivos coincidan.** Es responsabilidad de
quien edita. El comando de arriba lo verifica en un segundo; sería fácil convertirlo en una
prueba o en un paso de la integración continua.

---

**Siguiente:** [07 · Formulario de contacto](./07-formulario-de-contacto.md): el único
flujo con servidor del proyecto.

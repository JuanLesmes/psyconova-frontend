# 05 · Catálogo de componentes

Ficha de cada pieza del proyecto: qué hace, qué estado guarda, de qué depende y qué hay que
saber antes de tocarla.

**Convención de nombres del proyecto:** los archivos no llevan sufijo (`home.ts`, no
`home.component.ts`), pero las clases sí describen su tipo cuando hace falta
(`MainLayoutComponent`, `FooterComponent`). No es del todo consistente (`Navbar`, `Home`,
`MenuBar` no llevan sufijo), pero así está y conviene seguirlo.

**Convenciones de código comunes a todo el catálogo:** el estado de los componentes vive
en signals (`signal()`, `computed()`); las dependencias se piden con `inject()`; las
directivas declaran sus entradas y salidas con `input()` y `output()`; las plantillas usan
`@if` y `@for` (no hay `*ngIf`, `*ngFor` ni `CommonModule`); y `standalone: true` no se
escribe porque es el valor por defecto de Angular 21. Todo lo que toca `window`,
`document` o temporizadores va detrás de una comprobación `isPlatformBrowser`, porque cada
componente se ejecuta también al prerenderizar.

---

# Núcleo

## `App`: componente raíz

📁 [`app.ts`](../psyconova-frontend/src/app/app.ts) · selector `app-root`

Lo más simple del proyecto. Su plantilla completa son dos líneas: la pantalla de carga y el
`router-outlet`.

Lo único que hace en `ngOnInit`, y sólo en el navegador:

```ts
if (!this.esNavegador) return;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
```

Esto desactiva la restauración automática de scroll del navegador. Sin ello, al recargar la
página el navegador te devolvería a la mitad del sitio, pero con la pantalla de carga
encima, lo que se ve como un salto brusco al desaparecer. Con esto, cada carga empieza
arriba. La guarda de plataforma existe porque `history` y `window` no existen al
prerenderizar.

Ese `window.scrollTo` es el que produce el aviso `Not implemented: Window's scrollTo()
method` al correr las pruebas. Es inocuo.

## `appConfig`: configuración global

📁 [`app.config.ts`](../psyconova-frontend/src/app/app.config.ts)

Los seis providers de la aplicación:

| Provider | Para qué |
|---|---|
| `provideBrowserGlobalErrorListeners()` | Captura errores no manejados y los reporta a la consola |
| `provideZoneChangeDetection({ eventCoalescing: true })` | Detección de cambios con `zone.js`, agrupando eventos seguidos |
| `provideRouter(routes, withInMemoryScrolling(…))` | Rutas + scroll a anclas + volver arriba al cambiar de ruta |
| `provideHttpClient(withFetch())` | Cargar los archivos de traducción y enviar el formulario. `withFetch` porque al prerenderizar no existe `XMLHttpRequest` |
| `provideTranslateService({…})` | Traducciones; carga `assets/i18n/<idioma>.json` |
| `provideClientHydration(withEventReplay(), withIncrementalHydration())` | Hidratar el HTML prerenderizado, repetir los eventos previos y permitir `@defer (hydrate on …)` |

El idioma inicial es **siempre español** (`toTranslateCode(DEFAULT_LANGUAGE)`), no la
preferencia guardada: la configuración se construye también al prerenderizar, donde no
hay `localStorage` ni `navigator`. `LanguageService` cambia al idioma guardado ya en el
navegador, después de hidratar, para que el primer render coincida con el HTML generado.

`app.config.server.ts` añade `provideServerRendering(withRoutes(serverRoutes))` para el
prerenderizado; `app.routes.server.ts` marca todas las rutas como `Prerender`.

---

# Capa `core/`

## `LanguageService`

📁 [`core/services/language.service.ts`](../psyconova-frontend/src/app/core/services/language.service.ts)

El único estado compartido del proyecto. Es la fuente de verdad del idioma activo.

**API pública:**

| Miembro | Tipo | Qué es |
|---|---|---|
| `languages` | `readonly ['ES', 'EN']` | La lista de idiomas disponibles |
| `active` | `Signal<Language>` | Signal de sólo lectura con el idioma actual |
| `use(language)` | método | Cambia el idioma |

**Constantes y funciones sueltas exportadas** (están fuera de la clase porque
`app.config.ts` y el prerenderizado las necesitan antes de que exista el inyector):

- `DEFAULT_LANGUAGE`: `'ES'`. El idioma con el que arranca todo y con el que se
  prerenderiza.
- `resolveInitialLanguage()`: decide el idioma preferido del visitante. Sólo tiene sentido
  en el navegador.
- `toTranslateCode(lang)`: convierte `'ES'` a `'es'`, que es el nombre del archivo.

**Cómo decide el idioma**, en orden:

1. Lo que haya en `localStorage` bajo `psyconova.language`.
2. Los dos primeros caracteres de `navigator.language`, si son `ES` o `EN`.
3. Español.

**Por qué no lee la preferencia al construirse.** Con hidratación, lo primero que pinta el
navegador tiene que coincidir con el HTML prerenderizado, que siempre viene en español. Si
el servicio arrancara leyendo `localStorage`, alguien con el inglés guardado vería el primer
render en inglés sobre un HTML en español: Angular detecta el desajuste, descarta lo
prerenderizado y lo reconstruye entero. Así que arranca en español y, sólo en el navegador,
llama a `use(preferido)` en el constructor.

Al cambiar el idioma hace tres cosas: actualiza la signal, llama a `translate.use(code)` e
intenta guardarlo en `localStorage`. Un `effect()` mantiene `document.documentElement.lang`
a la par del idioma activo, también al prerenderizar (ahí `DOCUMENT` sí existe).

**Todos los accesos a `localStorage` van en `try/catch`.** En modo privado o con el
almacenamiento bloqueado, leer o escribir lanza una excepción. Sin persistencia el idioma
sigue funcionando durante la sesión; simplemente no se recuerda.

Está cubierto por `language.service.spec.ts`: resolución del idioma inicial, persistencia,
`<html lang>` y almacenamiento bloqueado.

## `ContactService`

📁 [`core/services/contact.service.ts`](../psyconova-frontend/src/app/core/services/contact.service.ts)

Una sola responsabilidad: hacer `POST` de la consulta al destino configurado.

```ts
send(request: ContactRequest): Observable<unknown>
get isConfigured(): boolean
```

El servicio **no sabe** a dónde envía: la URL está en `CONTACT_ENDPOINT`, en
`core/config/contact.config.ts`. Esa separación es a propósito: si mañana se cambia de
Netlify a un backend propio, se toca una constante y ni el servicio ni el componente se
enteran.

Si `CONTACT_ENDPOINT` está vacío, `send()` devuelve un error en vez de fingir que envió.
Ese principio se repite en todo el flujo de contacto y es deliberado: **nunca se le dice al
visitante que su consulta llegó si no llegó.**

## `SeoService`

📁 [`core/services/seo.service.ts`](../psyconova-frontend/src/app/core/services/seo.service.ts)

Deja una página lista para buscadores y redes sociales con una sola llamada:

```ts
apply(page: PageSeo): void          // título, descripción, robots, canonical, Open Graph, Twitter Card
setBusinessData(datos: object): void  // ficha del negocio (JSON-LD), sólo la portada
```

`apply()` pone **todo** a la vez. El motivo, del propio código: repartir el SEO entre
`index.html`, las rutas y cada componente es como se llega al fallo más común, que todas las
páginas declaren el mismo canonical. Aquí, si una página llama a `apply()`, está completa;
si no, le falta todo.

Detalles que conviene conocer:

- El canonical es un `<link>`, no un `<meta>`, así que el servicio `Meta` de Angular no lo
  cubre; se reutiliza el mismo elemento en vez de añadir uno por navegación.
- `apply()` retira los datos estructurados en cada página. Sólo la portada los pone después.
  Sin ese borrado, al navegar de la portada a los términos sin recargar, la ficha de negocio
  se quedaría pegada al documento.
- Las etiquetas Open Graph sólo sirven porque el sitio se prerenderiza: WhatsApp, LinkedIn
  y Facebook no ejecutan JavaScript.

## `contact.config.ts`

📁 [`core/config/contact.config.ts`](../psyconova-frontend/src/app/core/config/contact.config.ts)

**Este es el archivo que más vas a tocar.** Todo dato público de contacto sale de aquí.

| Constante | Contenido |
|---|---|
| `CONTACT_ENDPOINT` | `/.netlify/functions/contact` |
| `CONTACT_INFO` | WhatsApp (mostrado y en formato `wa.me`), correo |
| `CONTACT_FALLBACK_EMAIL` | Correo que se ofrece si el envío falla |
| `PRIVACY_POLICY_URL` | `/politica-de-privacidad` |
| `CRISIS_LINES` | Las tres líneas de atención en crisis |
| `CRISIS_WHATSAPP` | El WhatsApp de la Línea 106 |
| `LOCATION` | Calle, edificio, ciudad, consulta para Google, nivel de zoom |
| `MAP_CONSENT_KEY` | Clave de `localStorage` del consentimiento del mapa |

De `CONTACT_INFO` y `LOCATION` salen también la ficha de negocio que pone `Home` y el
destino por defecto de la función serverless: el correo no está escrito dos veces.

⚠️ **Sobre `CRISIS_LINES`, lee el comentario del archivo antes de tocar nada.** Los números
(106, 192, 123) están verificados contra minsalud.gov.co y saludcapital.gov.co en agosto de
2026. *Un número equivocado en una línea de crisis es peor que no tener ninguna.* Si hay que
cambiarlos, confírmalo primero con la fuente oficial.

`MAP_CONSENT_KEY` termina en `.v1` por un motivo: si el texto del aviso de consentimiento
cambia de forma sustancial, hay que subir la versión (`.v2`) para volver a pedir permiso a
quienes ya lo habían dado sobre un texto distinto.

## `map-consent.ts`

📁 [`core/config/map-consent.ts`](../psyconova-frontend/src/app/core/config/map-consent.ts)

La decisión del visitante sobre el mapa de Google, aislada de Angular para poder probarla:

```ts
type MapConsent = boolean | null;   // null: no ha decidido · true: aceptó · false: rechazó

interpretarConsentimientoMapa(guardado: string | null): MapConsent
leerConsentimientoMapa(): MapConsent
guardarConsentimientoMapa(decision: boolean): void
olvidarConsentimientoMapa(): void
```

Son tres estados y no dos porque "dijo que no" es distinto de "nunca se le preguntó": con un
booleano habría que volver a preguntar en cada visita a quien ya rechazó. Sólo `'1'` cuenta
como aceptado y sólo `'0'` como rechazado; cualquier otra cosa guardada se trata como "sin
decidir", **nunca como aceptado**, porque eso cargaría Google sin permiso y nadie lo notaría.

`consent.spec.ts` prueba la función real de interpretación con la tabla de valores.

## `navigation.config.ts`

📁 [`core/config/navigation.config.ts`](../psyconova-frontend/src/app/core/config/navigation.config.ts)

Las entradas del menú principal, en una sola lista:

```ts
export const MENU_LINKS = [
  { fragment: 'home', key: 'nav.home' },
  { fragment: 'nosotros', key: 'nav.what' },
  { fragment: 'services', key: 'nav.services' },
  { fragment: 'equipo', key: 'nav.about' },
  { fragment: 'contact', key: 'nav.contact' },
] as const;
```

La barra fija y la barra de la portada abren el mismo `MenuOverlay`, que recorre esta lista.
Añadir o quitar una sección del menú se hace aquí y en los dos archivos de idioma.

## `site.config.ts`

📁 [`core/config/site.config.ts`](../psyconova-frontend/src/app/core/config/site.config.ts)

El dominio, el nombre del sitio, la imagen para redes y los metadatos de cada página:

| Constante | Contenido |
|---|---|
| `SITE` | `url` (sin barra final), `name`, `locale`, imagen social y sus medidas |
| `PAGES` | `home`, `privacy`, `terms`, `notFound`: título, descripción, ruta y, si aplica, `noindex` |
| `absoluteUrl(path)` | Convierte una ruta interna en URL absoluta |

De `PAGES` salen tres cosas a la vez: los metadatos que aplica cada componente, las URLs
del sitemap (sólo las indexables) y la lista que la prueba `site.config.spec.ts` compara
con el router. Añadir una página aquí la mete en las tres.

**Por qué el dominio vive aquí y en ningún otro lado:** normalmente acaba copiado en
`index.html`, en el sitemap y en `robots.txt`, y al cambiarlo alguno se queda atrás. Aquí
es la única copia; `scripts/generate-seo-files.mjs` importa este mismo módulo en el
`prebuild`.

## `tales.config.ts`

📁 [`core/config/tales.config.ts`](../psyconova-frontend/src/app/core/config/tales.config.ts)

La palabra clave del cuento y la ruta del archivo.

```ts
export const TALE = {
  file: 'assets/cuentos/las-manadas.html',
  codes: ['manada', 'las manadas'],
};
```

⚠️ **La comprobación ocurre en el navegador, así que no es control de acceso real.**
Cualquiera puede abrir las herramientas de desarrollo y leer las claves, o pedir el archivo
directamente por su URL. El propio archivo lo advierte.

Sirve para lo que probablemente se busca (que el cuento se entregue en consulta y no quede
suelto para cualquiera que pase) pero no para proteger algo que de verdad no pueda verse.
Si hiciera falta control real, el camino es una función serverless que valide la clave en el
servidor. Lo que sí se hace es dejar `/assets/cuentos/` fuera del índice de los buscadores
en `robots.txt`.

`normalizeCode()` prepara lo que escribe el usuario antes de comparar: quita espacios
sobrantes, pasa a minúsculas, elimina tildes (`NFD` + `\p{Diacritic}`) y colapsa espacios
múltiples. Así, escribir `"Manáda"` o `"  las   manadas "` funciona igual. El comentario
explica por qué se usa `\p{Diacritic}` y no un rango de caracteres: *"un rango de
combinantes son símbolos invisibles en el código, imposibles de revisar"*.

`tales.config.spec.ts` cubre `isValidTaleCode()` y `normalizeCode()`.

## `contact-rules.ts`

📁 [`core/contact/contact-rules.ts`](../psyconova-frontend/src/app/core/contact/contact-rules.ts)

Las reglas de validación de una consulta, puras y sin dependencias: `LIMITES`,
`recortar()`, `escaparHtml()`, `esCorreoValido()` y `validarConsulta()`. Viven en `src/` y
no dentro de la función serverless porque el corredor de pruebas sólo mira `src/**`
(`tsconfig.spec.json`); la función las importa desde `netlify/functions/contact.mts`.
Están documentadas en [07 · Formulario de contacto](./07-formulario-de-contacto.md).

---

# Capa `layout/`

## `MainLayoutComponent`

📁 [`layout/main-layout/`](../psyconova-frontend/src/app/layout/main-layout/)

Envuelve todas las rutas. Su plantilla completa:

```html
<div class="site-frame">
  <div class="site-frame__border"></div>
  <a class="skip-link" href="#contenido">{{ 'nav.skipToContent' | translate }}</a>
  <app-navbar></app-navbar>
  <main class="main-layout" id="contenido" tabindex="-1"><router-outlet></router-outlet></main>
  <app-footer></app-footer>
</div>
```

Sin lógica. El `site-frame__border` es el borde turquesa fijo descrito en
[04 · Sistema de diseño](./04-sistema-de-diseno.md#formas-recurrentes). El enlace de salto
es lo primero que encuentra quien navega con teclado o lector de pantalla y le permite ir
directo al contenido sin tabular por el menú; `tabindex="-1"` en `<main>` permite llevarle
el foco.

## `Navbar`

📁 [`layout/components/navbar/`](../psyconova-frontend/src/app/layout/components/navbar/)

Barra fija superior. Pinta un `MenuBar` (botón de menú, logo, selector `ES / EN`) y un
`MenuOverlay` con `menuId="menu-principal"`.

**Estado:**

| Propiedad | Tipo | Qué guarda |
|---|---|---|
| `menuOpen` | `signal(false)` | Si el menú a pantalla completa está abierto |
| `visible` | `signal(false)` | Si la barra se muestra |
| `lastScrollY` | número privado | Posición anterior, para saber la dirección |

**La lógica de `actualizarVisibilidad()`**, en orden de prioridad:

1. Si el menú está abierto → visible, siempre.
2. Si no encuentra el elemento `#home` (es decir, no estamos en la portada) → visible: en
   las páginas legales y el 404 es la única navegación.
3. Si el hero todavía se ve en pantalla → **oculta**. La portada ya trae su propia barra.
4. Bajando más de 4 px → oculta. Subiendo más de 4 px → visible.

El margen de 4 px evita que el temblor del scroll en móvil haga parpadear la barra. La
visibilidad se calcula también en `ngOnInit` (sólo en el navegador): en una página sin hero
nadie dispara el scroll hasta que el visitante se mueve, y la barra quedaría invisible al
entrar.

Cuando está oculta, el `<header>` lleva el atributo `inert` y `MenuBar` recibe
`collapsed`: la barra sale del orden de tabulación y no recibe clics. `visibility: hidden`
va en la transición para que la ocultación se desvanezca en vez de cortarse.

⚠️ `@HostListener('window:scroll')` se ejecuta en cada evento de scroll sin limitación. Con
`zone.js` activo, eso dispara detección de cambios muy a menudo.

## `FooterComponent`

📁 [`layout/components/footer/`](../psyconova-frontend/src/app/layout/components/footer/)

Pie de página sobre fondo oscuro. Tres columnas (marca, navegación, contacto), un separador
y una barra inferior con el copyright y los enlaces legales.

Lo único que tiene de lógica es `readonly contactInfo = { ...CONTACT_INFO }`, para mostrar
el correo desde la configuración central. Sus enlaces de navegación son
`routerLink="/" fragment="…"` con las mismas anclas del menú.

---

# Secciones de la portada

## `HeroSection`

📁 [`features/home/components/hero-section/`](../psyconova-frontend/src/app/features/home/components/hero-section/) · `#home`

La primera pantalla: ocupa el alto completo de la ventana menos el borde del sitio.

**Lleva su propia barra de menú.** Sobre el fondo claro del hero, la barra fija translúcida
se vería mal, así que `Navbar` se oculta mientras el hero está en pantalla y el hero pinta
un `MenuBar` en su franja superior (`.hero-cover__topbar`, de 90 px, igual que la barra
fija) más un `MenuOverlay` con `menuId="menu-portada"`. Su único estado es
`menuOpen = signal(false)`.

Los dos comparten `LanguageService`, así que cambiar el idioma en cualquiera de los dos se
refleja en el otro de inmediato.

El título se compone de tres claves de traducción para poder resaltar una palabra:

```html
{{ 'hero.titleBefore' | translate }}
<span class="hero-cover__title-accent">{{ 'hero.titleAccent' | translate }}</span>
{{ 'hero.titleAfter' | translate }}
```

Resultado: "Una nueva **mirada** para la salud mental."

El botón de flecha del pie del hero (`scrollTo('nosotros')`) cierra el menú y espera 80 ms
antes de desplazarse, para que la animación de cierre no compita con el scroll.

## `IntroSection`

📁 [`features/home/components/intro-section/`](../psyconova-frontend/src/app/features/home/components/intro-section/) · `#nosotros`

La pieza más compleja del sitio: la "constelación" o "sinapsis". Dos capas con unidades
distintas: un SVG (`viewBox="0 0 1000 760"`) con las líneas y los puntos, que usa
`lineX`/`lineY`, y siete botones HTML posicionados en porcentaje (`x`/`y`). La conversión
es `lineX = x × 10` y `lineY = y × 7,6`; si mueves un nodo, tienes que actualizar los cuatro
números a mano.

**Estado**, todo en signals:

| Signal | Qué guarda |
|---|---|
| `activeId` | `id` del nodo señalado, o `null` |
| `currentLoopIndex` | Índice de la imagen actual del bucle |
| `previousLoopIndex` | Índice de la imagen anterior mientras se desvanece, o `null` |
| `activeNode`, `currentLoopImage`, `previousLoopImage` | `computed()` derivados de los anteriores; son lo que lee la plantilla |

**Dos comportamientos a la vez:**

**1. Bucle de imágenes en reposo.** Cuando nadie interactúa, el portal central rota tres
imágenes cada 3200 ms con un fundido cruzado. Para el fundido mantiene a la vez la imagen
anterior y la actual, y borra la anterior a los 980 ms (la transición dura menos). Con
`prefers-reduced-motion` el bucle no arranca y el centro se queda en la primera imagen.

**2. Nodos interactivos.** Siete botones alrededor del centro. Al pasar el mouse, enfocar
con el teclado o tocar uno: se ilumina su línea al centro, aparecen dos pulsos viajeros, y
el portal central cambia a la imagen de ese nodo. El bucle se pausa mientras haya un nodo
activo (`if (this.activeId()) return;` dentro del intervalo).

Al salir del nodo, `clearActiveDelayed()` espera **110 ms** antes de volver al bucle. Sin
esa espera, mover el mouse de un nodo a otro produciría un parpadeo del portal. Salir del
escenario entero (`mouseleave` en `.synapse-stage`) limpia el nodo de inmediato.

**Los tres temporizadores** (`loopIntervalId`, `cleanupTimeoutId`, `clearDelayId`) se
limpian en `ngOnDestroy`. Si añades otro, acuérdate de limpiarlo también. Ninguno corre al
prerenderizar: el HTML generado sale con la primera imagen del ciclo, que es con la que
arranca el navegador, así que no hay desajuste al hidratar.

**Sobre el SVG:** el degradado usa `gradientUnits="userSpaceOnUse"` y el comentario del
código explica por qué: con el valor por defecto (`objectBoundingBox`), una línea
perfectamente horizontal o vertical tiene una dimensión de cero y el degradado no se ve.
Las líneas en reposo usan color sólido por el mismo motivo.

Las imágenes del portal llevan `width="672" height="840"` para que el navegador reserve el
espacio antes de que carguen.

## `ServicesSection`

📁 [`features/home/components/services-section/`](../psyconova-frontend/src/app/features/home/components/services-section/) · `#services`

Fondo oscuro. Cabecera a dos columnas, lista de cuatro características numeradas y tres
tarjetas de servicio.

El TypeScript sólo guarda lo que **no** se traduce:

```ts
interface Service { num: string; key: string; accent: 'teal' | 'purple' | 'indigo'; }

services: Service[] = [
  { num: '01', key: 'personal',      accent: 'teal'   },
  { num: '02', key: 'professional',  accent: 'purple' },
  { num: '03', key: 'selfKnowledge', accent: 'indigo' },
];
```

Los textos se resuelven por composición de clave: `'services.cards.' + s.key + '.title'`.
Ese patrón se repite en varias secciones y es lo que mantiene el TypeScript libre de texto.

## `StoriesSection`

📁 [`features/home/components/stories-section/`](../psyconova-frontend/src/app/features/home/components/stories-section/) · `#cuentos`

Fondo oscuro. Presenta el cuento *Las Manadas* y lo desbloquea con una palabra clave.

**Estado:** `unlocked`, `code`, `wrongCode`. Son propiedades planas, no signals, porque
`ngModel` escribe en `code` directamente. Nada más.

El detalle bonito del diseño: mientras está bloqueado, **la portada del cuento se ve y se
anima** dentro del `<iframe>` (con `loading="lazy"` y `allow="fullscreen"`); lo que hay
encima es una capa transparente (`.tale__veil`) que intercepta los toques. Así el visitante
entiende qué es lo que está bloqueado. Al desbloquear, la capa desaparece y el formulario se
sustituye por un botón que abre el archivo en una pestaña nueva.

El desbloqueo **no se persiste**, y el comentario del código insiste en que es a propósito:
al recargar vuelve a pedirse la palabra. Un código incorrecto muestra el error sin cambiar
de estado; `clearError()` lo quita en cuanto la persona corrige lo que escribió.

`taleFrameUrl` pasa por `DomSanitizer.bypassSecurityTrustResourceUrl()` porque Angular
bloquea las URL de `[src]` en un iframe. Aquí es seguro: la URL es una constante del propio
proyecto, no viene del usuario.

## `TeamSection`

📁 [`features/home/components/team-section/`](../psyconova-frontend/src/app/features/home/components/team-section/) · `#equipo`

Fondo claro. Perfil de la directora clínica: foto en marco de arco, nombre, credenciales,
biografía, siete especialidades como etiquetas y su formación académica.

El TypeScript sólo guarda la foto y las claves de las especialidades. Todo el texto está en
i18n bajo `team.lead`. No hay más perfiles: cualquier ampliación del equipo se haría como
sección nueva.

## `CtaSection`: la sección de contacto

📁 [`features/home/components/cta-section/`](../psyconova-frontend/src/app/features/home/components/cta-section/) · `#contact`

La sección más grande del proyecto (838 líneas de SCSS, la que dispara el aviso de
presupuesto). Contiene cuatro cosas: el aviso de crisis, el formulario, las tarjetas de
información y el mapa.

**Estado:**

| Miembro | Tipo | Qué guarda |
|---|---|---|
| `state` | `signal<SubmitState>` | `idle`, `sending`, `success` o `error` |
| `isSending`, `submitted`, `hasError` | `computed()` | Derivados de `state`, para la plantilla |
| `mapConsent` | `signal<MapConsent>` | `null`, `true` o `false`; arranca con `leerConsentimientoMapa()` |
| `form` | objeto plano | Los campos del formulario. No es signal porque `ngModel` escribe en él directamente |

Está documentada por completo en [07 · Formulario de contacto](./07-formulario-de-contacto.md).
Lo esencial:

- **El aviso de crisis va primero**, antes del formulario. No lo muevas.
- **El botón de envío está deshabilitado hasta marcar el consentimiento.**
- **Nunca se finge un envío exitoso**: si falla, se muestra el error con el correo como
  alternativa.
- **El mapa no se carga hasta que el visitante lo autoriza.** Los tres estados del mapa
  (pregunta, rechazado, aceptado) van en una sola cadena `@if / @else if / @else`, y el
  `<iframe>` sólo existe en la última rama, así que ninguna petición sale a Google antes.
  Aceptar y rechazar son dos botones del mismo peso; quien rechaza no vuelve a ser
  preguntado, y puede cambiar de idea con `resetMapConsent()`.

`cta-section.spec.ts` cubre el envío con y sin consentimiento, el éxito, el error sin fingir
envío, el doble envío y los tres estados del mapa con `localStorage`.

---

# Capa `shared/`

## `LoadingScreen`

📁 [`shared/components/loading-screen/`](../psyconova-frontend/src/app/shared/components/loading-screen/)

Pantalla de carga sobre fondo oscuro: tres anillos girando, el logo, el lema y una barra de
progreso.

```ts
private static readonly ESPERA_MS = 900;   // cuánto se queda antes de empezar a irse
private static readonly SALIDA_MS = 400;   // debe coincidir con la transición de .ls en el SCSS
```

**Los tiempos son fijos y no miden nada**, y por eso son cortos. El comentario del código
recoge la medición de Lighthouse que justifica el valor: una espera de 2400 ms cuesta 18
puntos de rendimiento en móvil (79 frente a 97 sin pantalla). Como el sitio se
prerenderiza, el contenido ya está escrito cuando llega el visitante: una espera larga
taparía un sitio terminado. 900 ms deja ver el logo y la animación sin bloquear la
lectura, y si se sube hay que contar con que la nota baja en la misma medida.

Los temporizadores sólo corren en el navegador: al prerenderizar, Angular espera a que la
aplicación quede en reposo antes de escribir el HTML, y esa espera se sumaría a cada página
generada sin aportar nada. `visible` arranca en `true` en los dos lados, así que lo
prerenderizado y lo primero que pinta el navegador coinciden.

Lleva `aria-hidden="true"` para que los lectores de pantalla no la anuncien. `app.spec.ts`
comprueba que se quita sola, que dura menos de 1,5 s y que no deja temporizadores sueltos.

## `MenuBar`

📁 [`shared/components/menu-bar/`](../psyconova-frontend/src/app/shared/components/menu-bar/) · selector `app-menu-bar`

La barra superior del sitio: botón hamburguesa, logo y selector de idioma. La usan dos
contenedores, `Navbar` (fija) y `HeroSection` (sobre la portada); el contenedor decide dónde
está la barra y cuánto mide, y `MenuBar` ocupa el alto y centra los tres controles.

| Entrada / salida | Tipo | Para qué |
|---|---|---|
| `open` | `input.required<boolean>()` | El panel está abierto; mientras tanto el botón se oculta |
| `menuId` | `input.required<string>()` | `id` del panel que abre el botón, para `aria-controls` |
| `collapsed` | `input(false)` | Oculta la barra entera: sale del orden de tabulación y no recibe clics |
| `toggled` | `output<void>()` | Se emite al pulsar el botón; el contenedor cambia su `menuOpen` |

El botón lleva `aria-expanded` y `aria-controls`; el logo es un enlace a `#home` con su
nombre accesible (`nav.goHome`), por lo que la imagen queda decorativa (`alt=""`). El
selector recorre `languageService.languages` con `@for` y marca el activo con
`aria-pressed`.

## `MenuOverlay`

📁 [`shared/components/menu-overlay/`](../psyconova-frontend/src/app/shared/components/menu-overlay/) · selector `app-menu-overlay`

El panel del menú a pantalla completa, con las entradas de `MENU_LINKS`.

| Entrada / salida | Tipo | Para qué |
|---|---|---|
| `open` | `input.required<boolean>()` | Abierto o cerrado |
| `menuId` | `input.required<string>()` | Tiene que coincidir con el `aria-controls` del botón que lo abre |
| `closed` | `output<void>()` | Se emite al pulsar Escape, el botón de volver o cualquier enlace |

Es un `role="dialog"` con `aria-modal="true"`, y eso es una promesa: quien usa lector de
pantalla entiende que lo de detrás no existe mientras esté abierto. `appFocusTrap` la
cumple. Cerrado usa `visibility: hidden`, así que sus enlaces quedan fuera del orden de
tabulación y nadie tabula hacia un menú invisible.

## `RevealDirective`

📁 [`shared/directives/reveal.directive.ts`](../psyconova-frontend/src/app/shared/directives/reveal.directive.ts) · selector `[appReveal]`

Documentada en [04 · Sistema de diseño](./04-sistema-de-diseno.md#la-animación-de-aparición-reveal).
Entradas `revealType`, `revealDelay` y `revealThreshold`; no hace nada al prerenderizar ni
con movimiento reducido. Exporta `prefiereMenosMovimiento()`.

## `FocusTrapDirective`

📁 [`shared/directives/focus-trap.directive.ts`](../psyconova-frontend/src/app/shared/directives/focus-trap.directive.ts) · selector `[appFocusTrap]`

Encierra el foco dentro de un panel mientras está abierto.

| Entrada / salida | Tipo | Para qué |
|---|---|---|
| `appFocusTrap` | `input.required<boolean>()` | El panel está abierto |
| `escapePressed` | `output<void>()` | Se emite al pulsar Escape, para que el componente cierre |

Cumple las tres partes de la promesa del diálogo: al abrir, el foco entra en el panel (con
60 ms de espera, porque el panel se muestra con una transición de `visibility`); mientras
está abierto, Tab y Mayús+Tab dan la vuelta dentro; al cerrar, el foco vuelve al elemento
que lo abrió, pero sólo si sigue dentro del panel (si el usuario ya lo movió, arrastrarlo
de vuelta sería peor).

La lista de elementos enfocables se recalcula en cada pulsación y descarta los ocultos por
CSS mirando `getComputedStyle`, no `offsetParent`, porque jsdom no calcula la maquetación.
`escapePressed` es una salida y no una entrada llamada `onEscape` porque Angular prohíbe
enlazar propiedades que empiecen por `on`.

`focus-trap.directive.spec.ts` cubre los ocho comportamientos con teclado.

## Sustituto de `IntersectionObserver` para las pruebas

📁 [`testing/intersection-observer.stub.ts`](../psyconova-frontend/src/app/testing/intersection-observer.stub.ts)

`instalarIntersectionObserverFalso()` define un `IntersectionObserver` vacío en
`globalThis`. jsdom no lo trae y `RevealDirective` lo usa en cada sección: sin él, montar
cualquier componente con `appReveal` revienta antes de probar nada. Lo llaman `home.spec.ts`
y `cta-section.spec.ts`.

---

# Páginas

## `Home`

📁 [`features/home/pages/home/`](../psyconova-frontend/src/app/features/home/pages/home/)

Su plantilla son seis etiquetas, las tres últimas diferidas:

```html
<app-hero-section />
<app-intro-section />
<app-services-section />
@defer (hydrate on viewport) { <app-stories-section /> }
@defer (hydrate on viewport) { <app-team-section /> }
@defer (hydrate on viewport) { <app-cta-section /> }
```

**Para reordenar las secciones del sitio, este es el único archivo que hay que tocar.**

En `ngOnInit` aplica `PAGES.home` con `SeoService` y pone la ficha de negocio
(`MedicalBusiness`, JSON-LD) con los datos de `contact.config.ts`, para que si cambia la
dirección cambie también en la ficha.

## `PrivacyPolicy` y `TermsOfUse`

📁 [`features/legal/pages/`](../psyconova-frontend/src/app/features/legal/pages/)

Documentos legales, cargados bajo demanda. El texto va **directo en la plantilla**, no en
i18n, y el comentario del código explica por qué: es un documento regido por la ley
colombiana, su versión vinculante es la española, y traducirlo crearía dos textos que
podrían decir cosas distintas. Cada uno aplica sus metadatos con `SeoService`.

Los dos comparten `../../legal.scss`.

⚠️ **Los dos llevan un aviso visible de "Documento en revisión"** (el bloque
`.legal__draft`), con un comentario en el HTML que indica quitarlo cuando el texto quede
validado jurídicamente. Mientras el aviso siga ahí, el documento no es definitivo. Ver
[10 · Privacidad y legal](./10-privacidad-y-legal.md).

## `NotFound`

📁 [`features/not-found/`](../psyconova-frontend/src/app/features/not-found/) · rutas `/404` y `**`

Página de error, cargada bajo demanda. Muestra el código, dos botones (ir al inicio,
escribirnos) y el mismo aviso de crisis de la sección de contacto: alguien puede llegar
aquí desde un enlace roto en un momento malo, y esta pantalla no puede ser un callejón sin
salida. Aplica `PAGES.notFound`, marcada `noindex`, que la deja fuera del sitemap.

Su texto está escrito directamente en la plantilla, sólo en español.

---

**Siguiente:** [06 · Internacionalización](./06-internacionalizacion.md): cómo funcionan
los idiomas.

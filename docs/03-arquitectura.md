# 03 · Arquitectura

## Stack

| Pieza | Qué se usa | Versión |
|---|---|---|
| Framework | Angular (componentes standalone, signals, control de flujo `@if`/`@for`) | 21.x |
| Prerenderizado | `@angular/ssr` con `outputMode: "static"` e hidratación incremental | 21.x |
| Lenguaje | TypeScript, modo estricto | 5.9 |
| Estilos | SCSS, sin framework de CSS | |
| Traducciones | `@ngx-translate/core` + `http-loader` | 18.x |
| Pruebas | Vitest sobre jsdom (vía `@angular/build:unit-test`) | Vitest 4 |
| Linter y formato | angular-eslint y Prettier | 21.x / 3.x |
| Integración continua | GitHub Actions (`.github/workflows/ci.yml`) | |
| Backend | Una función serverless de Netlify | `@netlify/functions` 6 |
| Correo | Resend (API HTTP) | |
| Imágenes e iconos | `sharp` en scripts propios | 0.35 |
| Alojamiento | Netlify | |

**Lo que deliberadamente no hay:** no hay librería de componentes (ni Material, ni
Bootstrap, ni Tailwind); todo el CSS está escrito a mano. No hay gestor de estado (NgRx,
Signals Store); el único estado compartido es el idioma. No hay servidor en tiempo de
ejecución: el HTML de cada página se genera al compilar y Netlify sirve archivos estáticos,
más una única función serverless para el formulario. No hay base de datos.

Para un sitio de presentación de este tamaño, esas ausencias son la decisión correcta.

## Estructura de carpetas

```
src/
├── index.html                  Página HTML única. Iconos, precarga de fuentes, <app-root>.
├── main.ts                     Arranque en el navegador.
├── main.server.ts              Arranque para el prerenderizado.
├── styles.scss                 Estilos globales: contenedores, botones, reveal, movimiento reducido.
├── styles/
│   ├── _variables.scss         Tokens de diseño (ojo: ver doc 04, casi no se usan)
│   ├── _fonts.scss             @font-face de las fuentes autoalojadas (GENERADO, no editar)
│   └── _reset.scss             Normalización mínima del navegador
│
├── assets/
│   ├── i18n/{es,en}.json       TODOS los textos visibles del sitio
│   ├── images/                 Imágenes ya optimizadas en WebP (esto sí se publica)
│   ├── fonts/                  Arimo y Roboto en woff2, servidas desde el propio dominio
│   ├── icons/                  Favicon e iconos de pantalla de inicio
│   └── cuentos/las-manadas.html  El cuento interactivo, autocontenido
│
└── app/
    ├── app.ts / app.html       Componente raíz: pantalla de carga + router-outlet
    ├── app.config.ts           Providers: router, http, traducciones, hidratación
    ├── app.config.server.ts    Lo mismo, más el proveedor de prerenderizado
    ├── app.routes.ts           Definición de rutas
    ├── app.routes.server.ts    Todas las rutas se prerenderizan
    │
    ├── core/                   ─── CAPA 1: lógica sin interfaz ───
    │   ├── config/
    │   │   ├── contact.config.ts   Teléfonos, correo, dirección, líneas de crisis
    │   │   ├── map-consent.ts      Leer, guardar y olvidar la decisión sobre el mapa
    │   │   ├── navigation.config.ts  Las entradas del menú (MENU_LINKS)
    │   │   ├── site.config.ts      Dominio, nombre y metadatos de cada página (PAGES)
    │   │   └── tales.config.ts     Palabra clave del cuento
    │   ├── contact/
    │   │   └── contact-rules.ts    Validación pura de una consulta (la usa la función serverless)
    │   └── services/
    │       ├── language.service.ts Idioma activo (único estado compartido)
    │       ├── contact.service.ts  Envío del formulario
    │       └── seo.service.ts      Título, descripción, canonical, Open Graph, ficha de negocio
    │
    ├── layout/                 ─── CAPA 2: el marco de la página ───
    │   ├── main-layout/            Enlace de salto + navbar + contenido + footer + borde
    │   └── components/
    │       ├── navbar/             Barra fija que aparece y desaparece con el scroll
    │       └── footer/             Pie de página
    │
    ├── features/               ─── CAPA 3: el contenido ───
    │   ├── home/
    │   │   ├── pages/home/         Apila las seis secciones y pone el SEO de la portada
    │   │   └── components/         Las seis secciones de la portada
    │   │       ├── hero-section/
    │   │       ├── intro-section/
    │   │       ├── services-section/
    │   │       ├── stories-section/
    │   │       ├── team-section/
    │   │       └── cta-section/    (es la sección de CONTACTO)
    │   ├── legal/
    │   │   ├── legal.scss          Estilos compartidos por los dos documentos
    │   │   └── pages/{privacy-policy,terms-of-use}/
    │   └── not-found/              Página 404
    │
    ├── shared/                 ─── CAPA 4: piezas reutilizables ───
    │   ├── components/
    │   │   ├── loading-screen/     Pantalla de carga inicial
    │   │   ├── menu-bar/           Botón de menú, logo y selector de idioma
    │   │   └── menu-overlay/       El menú a pantalla completa
    │   └── directives/
    │       ├── reveal.directive.ts     Animación de aparición al hacer scroll
    │       └── focus-trap.directive.ts Encierro del foco en el menú abierto
    │
    └── testing/
        └── intersection-observer.stub.ts  Sustituto de IntersectionObserver para las pruebas
```

Fuera de `src/`:

```
netlify/functions/contact.mts   La única pieza de servidor del proyecto
scripts/optimize-images.mjs     Conversión de imágenes a WebP
scripts/generate-icons.mjs      Favicon e iconos a partir del logo original
scripts/download-fonts.mjs      Descarga las fuentes y escribe _fonts.scss
scripts/social-image.mjs        Imagen para compartir en redes
scripts/generate-seo-files.mjs  sitemap.xml y robots.txt (prebuild)
scripts/copy-404.mjs            404.html en la raíz del build (postbuild)
scripts/generate-csp.mjs        Content Security Policy con hashes (postbuild)
eslint.config.js                Reglas de angular-eslint
design/                         Originales pesados. Fuera de Git, sólo en el disco de quien desarrolla.
```

## Las cuatro capas

La regla es la de siempre en Angular y aquí se cumple sin excepciones: **las dependencias
sólo van hacia abajo.**

| Capa | Puede importar de | Nunca importa de |
|---|---|---|
| `features/` | `shared/`, `core/` | otra carpeta de `features/` |
| `layout/` | `shared/`, `core/` | `features/` |
| `shared/` | `core/` (sólo configuración y servicios) | `features/`, `layout/` |
| `core/` | nada del proyecto | todo lo demás |

`shared/` importa de `core/` en dos sitios concretos: `MenuBar` usa `LanguageService` y
`MenuOverlay` lee `MENU_LINKS`. Es la dirección correcta (hacia abajo); lo que no puede
pasar es lo contrario.

Si te encuentras necesitando importar un componente de `features/home/` desde `layout/`, la
pieza está en el sitio equivocado: muévela a `shared/`.

### Por qué `core/config/` es tan importante

La carpeta `core/config/` merece atención especial porque resuelve un problema real. El
comentario de `contact.config.ts` lo dice sin rodeos:

> *"Viven aquí y no en los archivos de traducción porque no se traducen, y en un solo sitio
> para que no vuelva a pasar lo del teléfono de ejemplo repetido en tres plantillas."*

Hay una sola fuente para cada dato. **Cualquier dato de contacto, dirección o número de
teléfono va en `contact.config.ts`, sin excepción.** Lo mismo aplica al dominio y a los
metadatos de las páginas (`site.config.ts`) y a las entradas del menú
(`navigation.config.ts`): de esas constantes salen a la vez la interfaz, el sitemap, la
ficha de negocio y el destino por defecto de los correos.

## Componentes en pantalla

```
App  (app.ts)
├── LoadingScreen              ← superpuesto, se va solo a los 900 ms
└── router-outlet
    └── MainLayoutComponent
        ├── .site-frame__border    ← el borde turquesa fijo alrededor de todo
        ├── .skip-link             ← enlace de salto, visible sólo al recibir el foco
        ├── Navbar                 ← fijo arriba, se oculta y aparece con el scroll
        │   ├── MenuBar
        │   └── MenuOverlay
        ├── router-outlet
        │   ├── Home  →  HeroSection      (con su propio MenuBar + MenuOverlay)
        │   │             IntroSection
        │   │             ServicesSection
        │   │             @defer StoriesSection
        │   │             @defer TeamSection
        │   │             @defer CtaSection
        │   ├── PrivacyPolicy
        │   ├── TermsOfUse
        │   └── NotFound
        └── FooterComponent
```

`Home` casi no tiene lógica: su plantilla son seis etiquetas, una por sección, y su clase
sólo aplica el SEO de la portada. Toda la funcionalidad vive en las secciones. Eso hace que
cada sección se pueda mover, reordenar o quitar sin tocar nada más.

Las tres últimas secciones van dentro de `@defer (hydrate on viewport)`: se prerenderizan
enteras (el HTML completo está para los buscadores), pero su JavaScript sólo se descarga e
hidrata cuando entran en pantalla.

`Navbar` y `HeroSection` usan las mismas dos piezas de `shared/`: `MenuBar` (botón,
logo, selector de idioma) y `MenuOverlay` (el panel a pantalla completa). Cada contenedor
sólo guarda si su menú está abierto.

## Rutas y navegación

Las rutas se definen en [`app.routes.ts`](../psyconova-frontend/src/app/app.routes.ts):

| Ruta | Componente | Cómo se carga |
|---|---|---|
| `/` | `Home` | Importación directa: es lo primero que se pinta |
| `/politica-de-privacidad` | `PrivacyPolicy` | Bajo demanda (`loadComponent`) |
| `/terminos-de-uso` | `TermsOfUse` | Bajo demanda |
| `/404` | `NotFound` | Bajo demanda. De aquí sale el `404.html` que sirve Netlify |
| cualquier otra (`**`) | `NotFound` | Bajo demanda, para enlaces rotos dentro del sitio |

Todas las rutas cuelgan de `MainLayoutComponent`, así que todas heredan navbar, footer y
borde. Las cuatro se prerenderizan (`app.routes.server.ts` marca `**` como `Prerender`).
El 404 aparece dos veces a propósito: el comodín no se puede enumerar y por tanto no se
puede prerenderizar; la ruta concreta `/404` sí, y de ella sale el archivo que Netlify
devuelve con código 404 real para cualquier dirección inexistente.

Cada página tiene sus metadatos en `PAGES` (`site.config.ts`), y una prueba
(`site.config.spec.ts`) comprueba que el router y `PAGES` describen exactamente las mismas
páginas. Si añades una ruta sin su entrada en `PAGES`, la prueba falla.

Dentro de la portada la navegación es por anclas: `#home`, `#nosotros`, `#services`,
`#cuentos`, `#equipo` y `#contact`. Las entradas del menú están en `MENU_LINKS`
(`core/config/navigation.config.ts`), cada una con su `fragment` y su clave de traducción;
el menú tiene cinco (inicio, qué es, servicios, nosotros → `#equipo`, contacto). La sección
Cuentos no tiene entrada en el menú: se llega a ella desplazándose. Los enlaces son
`<a routerLink="/" [fragment]="…">`, que generan `href` y funcionan con teclado.

El comportamiento del scroll se configura en `app.config.ts`:

```ts
withInMemoryScrolling({
  anchorScrolling: 'enabled',        // que los #fragmentos funcionen
  scrollPositionRestoration: 'top',  // al cambiar de ruta, empezar arriba
})
```

## Ciclo de vida de una visita

1. El navegador descarga el HTML **ya prerenderizado** de la página (la portada completa,
   con el CSS crítico incrustado). Con eso ya hay contenido en pantalla; los buscadores y
   los lectores de enlaces de WhatsApp o LinkedIn no necesitan más.
2. En paralelo se precargan las dos fuentes del primer pintado (`index.html` declara
   `<link rel="preload">` para los subconjuntos `latin`) y se descarga el JavaScript
   inicial (unos 118 kB transferidos).
3. Angular hidrata el HTML existente en vez de volver a pintarlo, y repite los eventos que
   el visitante haya disparado mientras tanto (`withEventReplay`).
4. `LanguageService` arranca en español, igual que el HTML generado, y sólo después de
   hidratar cambia al idioma guardado en `localStorage` o al del navegador. Así el primer
   render coincide con el HTML y no hay salto.
5. `App.ngOnInit` pone `history.scrollRestoration = 'manual'` y hace `scrollTo(0, 0)`, para
   que al recargar la página siempre se empiece desde arriba. Sólo en el navegador: al
   prerenderizar no existen `history` ni `window`.
6. La pantalla de carga se retira sola: a los 900 ms empieza a desvanecerse y 400 ms
   después se quita del DOM. Sus temporizadores tampoco corren al prerenderizar.
7. Las secciones de cuentos, equipo y contacto hidratan cuando entran en pantalla.

Nota sobre el punto 6: **la pantalla de carga no espera a nada.** Son dos `setTimeout`
fijos, y son cortos a propósito: como el contenido ya viene prerenderizado, una espera
larga taparía un sitio terminado. El comentario de `loading-screen.ts` recoge la medición
de Lighthouse que justifica los 900 ms.

## Decisiones técnicas que conviene entender

Estas son las decisiones que un recién llegado cuestionaría, con el motivo real de cada una.

**Todo el contenido en una sola página.** El sitio se lee como una narrativa continua, no
como un catálogo. La contrapartida es de posicionamiento: hay una sola URL de contenido,
así que no se puede competir por búsquedas distintas ("realidad virtual terapéutica" y
"cuentos terapéuticos" caen en la misma dirección).

**Prerenderizado estático, no SSR en vivo.** `angular.json` declara `outputMode: "static"`:
el HTML se genera al compilar y Netlify sirve archivos. No hay un servidor de Node
corriendo en producción, con lo que no hay nada que se caiga ni que cueste dinero por
visita. Lo que se gana es que los buscadores y las tarjetas de enlace de las redes ven el
contenido completo sin ejecutar JavaScript.

**Hidratación incremental.** `app.config.ts` usa
`provideClientHydration(withEventReplay(), withIncrementalHydration())`. Las secciones
bajo `@defer (hydrate on viewport)` en `home.html` se prerenderizan enteras y su código sólo
se carga al entrar en pantalla.

**El cuento es un archivo HTML suelto, no un componente de Angular.** Está en
`assets/cuentos/las-manadas.html` y se muestra dentro de un `<iframe>`. Es una aplicación
autocontenida con sus propios estilos y scripts, y así se puede actualizar sin tocar el
sitio. Tiene sus propias fuentes, su propia paleta y su propio JavaScript, todos
deliberadamente distintos del sitio.

**La portada lleva su propia barra de menú.** Sobre el fondo claro del hero, la barra fija
con fondo blanco translúcido se vería mal, así que `HeroSection` pinta la barra sobre la
portada y `Navbar` se esconde mientras el hero está en pantalla. Las dos barras son el mismo
componente (`MenuBar`) y abren el mismo panel (`MenuOverlay`), con las entradas de
`MENU_LINKS`; la barra del hero mide lo mismo que la fija (90 px, 76 px en móvil) para que
una sustituya a la otra sin que el logo salte. Comparten el idioma a través de
`LanguageService`.

**Los datos de contacto no están traducidos.** Un número de teléfono es el mismo en
cualquier idioma. Meterlo en los archivos de i18n significaría mantener dos copias que
pueden divergir.

**La política de privacidad no está traducida.** Decisión explícita del código: *"es un
documento legal regido por la ley colombiana, así que su versión vinculante es la española.
Traducirlo crearía dos textos que podrían decir cosas distintas."*

**El SEO sale de una sola llamada.** Cada página llama a `SeoService.apply(PAGES.x)` en
`ngOnInit`, que pone título, descripción, `robots`, canonical, Open Graph y Twitter Card a
la vez. Si una página lo llama, está completa; si no, le falta todo. No hay estados a
medias, que es como se acaba con todas las páginas declarando el mismo canonical.

**Se usa `zone.js`, no la detección de cambios sin zonas.** `app.config.ts` declara
`provideZoneChangeDetection({ eventCoalescing: true })`. El estado de los componentes vive
en signals y las plantillas usan `@if`/`@for`, así que pasar a la detección sin zonas sería
un cambio pequeño, pero no está hecho.

**La Content Security Policy se genera en cada build.** Angular incrusta scripts en línea
cuyo contenido cambia entre versiones; un hash escrito a mano se quedaría obsoleto en la
siguiente actualización y el sitio dejaría de arrancar. Por eso `generate-csp.mjs` calcula
los hashes sobre el HTML construido y escribe `_headers`. Ver
[09 · Despliegue](./09-despliegue-y-operacion.md).

## Estado compartido

Prácticamente no hay. El único dato que viven varios componentes a la vez es **el idioma**,
y lo gestiona `LanguageService` con una signal:

```ts
private readonly current = signal<Language>(DEFAULT_LANGUAGE);
readonly active = this.current.asReadonly();
```

Todo lo demás es estado local de cada componente, también en signals: si el menú está
abierto (`Navbar.menuOpen`, `HeroSection.menuOpen`), qué nodo de la constelación está
activo (`IntroSection.activeId`), en qué paso va el envío del formulario
(`CtaSection.state`). Ninguno de esos datos necesita salir de su componente, y por eso el
proyecto no tiene ni necesita un gestor de estado.

Lo que sí se guarda de forma persistente, en `localStorage` del navegador:

| Clave | Qué guarda | Quién la escribe |
|---|---|---|
| `psyconova.language` | `ES` o `EN` | `LanguageService` |
| `psyconova.mapConsent.v1` | `'1'` si aceptó cargar el mapa, `'0'` si lo rechazó | `CtaSection`, a través de `core/config/map-consent.ts` |

Todas las lecturas y escrituras van envueltas en `try/catch`, porque en modo privado o con
las cookies bloqueadas `localStorage` lanza excepción. El sitio sigue funcionando sin él:
simplemente vuelve a preguntar en cada visita.

---

**Siguiente:** [04 · Sistema de diseño](./04-sistema-de-diseno.md): colores, tipografía y
patrones visuales.

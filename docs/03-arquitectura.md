# 03 · Arquitectura

## Stack

| Pieza | Qué se usa | Versión |
|---|---|---|
| Framework | Angular (componentes standalone) | 21.x |
| Lenguaje | TypeScript | 5.9 |
| Estilos | SCSS, sin framework de CSS | — |
| Traducciones | `@ngx-translate/core` + `http-loader` | 18.x |
| Pruebas | Vitest sobre jsdom (vía `@angular/build:unit-test`) | Vitest 4 |
| Backend | Una función serverless de Netlify | `@netlify/functions` 6 |
| Correo | Resend (API HTTP) | — |
| Imágenes | `sharp` en un script propio | 0.35 |
| Alojamiento | Netlify | — |

**Lo que deliberadamente no hay:** no hay librería de componentes (ni Material, ni
Bootstrap, ni Tailwind); todo el CSS está escrito a mano. No hay gestor de estado (NgRx,
Signals Store); el único estado compartido es el idioma. No hay renderizado en servidor
(SSR); el sitio es puramente cliente. No hay base de datos.

Para un sitio de presentación de este tamaño, esas ausencias son la decisión correcta. La
única que tiene consecuencias reales es la de SSR, porque afecta al posicionamiento en
buscadores; está discutida en las [propuestas](./PROPUESTAS.md).

## Estructura de carpetas

> **📊 GRÁFICO G-04 — Árbol de carpetas comentado**
> **Va aquí:** en lugar del bloque de texto de abajo, o justo encima como versión visual.
> **Tipo:** árbol de directorios dibujado, con anotaciones a la derecha unidas por líneas.
> **Debe mostrar:** el árbol de `src/app/` hasta dos niveles, con una anotación por carpeta
> que diga **qué clase de código vive ahí y qué NO debe vivir ahí**.
> **Anotaciones exactas:**
> - `core/` → "Lo que no se ve. Servicios y configuración. Una sola instancia para toda la
>   app. **Nunca** contiene componentes."
> - `layout/` → "El marco que rodea a todas las páginas: navbar, footer, el borde del sitio."
> - `features/` → "Una carpeta por funcionalidad. Contiene páginas (rutas) y los componentes
>   que sólo usa esa funcionalidad."
> - `shared/` → "Piezas reutilizables sin lógica de negocio. Si algo aquí importa de
>   `features/`, está mal."
> **Estilo:** usa un color por capa y repítelo en el gráfico G-05, para que se lean juntos.

```
src/
├── index.html                  Página HTML única. Título, favicon, <app-root>.
├── main.ts                     Arranque de la aplicación.
├── styles.scss                 Estilos globales: contenedores, botones, reveal.
├── styles/
│   ├── _variables.scss         Tokens de diseño (ojo: ver doc 04, casi no se usan)
│   └── _reset.scss             Normalización mínima del navegador
│
├── assets/
│   ├── i18n/{es,en}.json       TODOS los textos visibles del sitio
│   ├── images/                 Imágenes ya optimizadas en WebP (esto sí se publica)
│   ├── icons/                  Favicon
│   └── cuentos/las-manadas.html  El cuento interactivo, autocontenido
│
└── app/
    ├── app.ts / app.html       Componente raíz: pantalla de carga + router-outlet
    ├── app.config.ts           Providers: router, http, traducciones
    ├── app.routes.ts           Definición de rutas
    │
    ├── core/                   ─── CAPA 1: lógica sin interfaz ───
    │   ├── config/
    │   │   ├── contact.config.ts   Teléfonos, correo, dirección, líneas de crisis
    │   │   └── tales.config.ts     Palabra clave del cuento
    │   └── services/
    │       ├── language.service.ts Idioma activo (único estado compartido)
    │       └── contact.service.ts  Envío del formulario
    │
    ├── layout/                 ─── CAPA 2: el marco de la página ───
    │   ├── main-layout/            Navbar + contenido + footer + borde
    │   └── components/
    │       ├── navbar/             Barra superior que aparece y desaparece
    │       └── footer/             Pie de página
    │
    ├── features/               ─── CAPA 3: el contenido ───
    │   ├── home/
    │   │   ├── pages/home/         Sólo apila las seis secciones
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
    │   └── about/, services/, contact/   ← VACÍAS, plantilla sin usar
    │
    └── shared/                 ─── CAPA 4: piezas reutilizables ───
        ├── components/
        │   ├── loading-screen/     Pantalla de carga inicial
        │   ├── primary-button/     ← vacío, nadie lo usa
        │   └── section-title/      ← vacío, nadie lo usa
        └── directives/
            └── reveal.directive.ts Animación de aparición al hacer scroll
```

Fuera de `src/`:

```
netlify/functions/contact.mts   La única pieza de servidor del proyecto
scripts/optimize-images.mjs     Conversión de imágenes a WebP
design/source-images/           Originales pesados. NO se publican.
```

## Las cuatro capas

> **📊 GRÁFICO G-05 — Las cuatro capas y quién puede llamar a quién**
> **Va aquí:** justo debajo de este párrafo, antes de la tabla de reglas.
> **Tipo:** diagrama de capas apiladas con flechas de dependencia.
> **Debe mostrar:** las cuatro capas como bandas horizontales, y flechas que indiquen las
> dependencias **permitidas**. Marca con una flecha tachada en rojo las prohibidas.
> **Contenido:**
> - Banda superior: `features/` (home, legal) y `layout/` (navbar, footer), lado a lado.
> - Banda media: `shared/` (loading-screen, reveal).
> - Banda inferior: `core/` (services, config).
> - **Flechas permitidas (verdes, hacia abajo):** features → shared, features → core,
>   layout → shared, layout → core, shared → (nada).
> - **Flechas prohibidas (rojas, tachadas):** core → features, core → shared,
>   shared → features, features/home → features/legal.
> **Etiqueta clave para poner en grande:** "Las dependencias sólo van hacia abajo."
> **Estilo:** mismos colores por capa que el gráfico G-04.

La regla es la de siempre en Angular y aquí se cumple sin excepciones: **las dependencias
sólo van hacia abajo.**

| Capa | Puede importar de | Nunca importa de |
|---|---|---|
| `features/` | `shared/`, `core/` | otra carpeta de `features/` |
| `layout/` | `shared/`, `core/` | `features/` |
| `shared/` | nada del proyecto | `features/`, `layout/`, `core/` |
| `core/` | nada del proyecto | todo lo demás |

Si te encuentras necesitando importar un componente de `features/home/` desde `layout/`, la
pieza está en el sitio equivocado: muévela a `shared/`.

### Por qué `core/config/` es tan importante

La carpeta `core/config/` merece atención especial porque resuelve un problema real que ya
ocurrió en este proyecto. El comentario en el código lo dice sin rodeos:

> *"Viven aquí y no en los archivos de traducción porque no se traducen, y en un solo sitio
> para que no vuelva a pasar lo del teléfono de ejemplo repetido en tres plantillas."*

Antes, el teléfono estaba escrito a mano en varias plantillas y quedó uno de ejemplo
publicado. Ahora hay una sola fuente. **Cualquier dato de contacto, dirección o número de
teléfono va en `contact.config.ts`, sin excepción.**

## Componentes en pantalla

> **📊 GRÁFICO G-06 — Árbol de componentes en pantalla**
> **Va aquí:** debajo de este párrafo, reemplazando o acompañando al diagrama de texto.
> **Tipo:** árbol jerárquico, de arriba hacia abajo.
> **Debe mostrar:** qué componente contiene a cuál, empezando por `App`. Marca de forma
> distinta (por ejemplo con un borde punteado) los que se muestran **encima** de todo y no
> dentro del flujo: `LoadingScreen`, el `navbar` fijo y el borde del sitio.
> **Contenido:** exactamente el árbol de texto que aparece abajo.
> **Añade a un lado:** una nota que diga "HeroSection duplica el menú y el selector de
> idioma de Navbar. Es deliberado: el hero necesita su propia versión clara sobre fondo
> claro."

```
App  (app.ts)
├── LoadingScreen              ← superpuesto, se va solo a los 2,4 s
└── router-outlet
    └── MainLayoutComponent
        ├── .site-frame__border    ← el borde turquesa fijo alrededor de todo
        ├── Navbar                 ← fijo arriba, se oculta y aparece con el scroll
        ├── router-outlet
        │   ├── Home  →  HeroSection
        │   │             IntroSection
        │   │             ServicesSection
        │   │             StoriesSection
        │   │             TeamSection
        │   │             CtaSection
        │   ├── PrivacyPolicy
        │   └── TermsOfUse
        └── FooterComponent
```

`Home` no tiene lógica: su plantilla completa son seis etiquetas, una por sección. Toda la
funcionalidad vive en las secciones. Eso hace que cada sección se pueda mover, reordenar o
quitar sin tocar nada más.

## Rutas y navegación

> **📊 GRÁFICO G-07 — Mapa de rutas y anclas**
> **Va aquí:** debajo de la tabla de rutas.
> **Tipo:** diagrama mixto: a la izquierda una lista de URLs, a la derecha la página larga
> con sus anclas, y flechas que las conectan.
> **Debe mostrar:** la diferencia entre las tres cosas que aquí llamamos "navegación":
> 1. **Rutas reales** (cambian de página): `/`, `/politica-de-privacidad`, `/terminos-de-uso`.
> 2. **Anclas** (hacen scroll dentro de la portada): `#home`, `#nosotros`, `#services`,
>    `#cuentos`, `#equipo`, `#contact`.
> 3. **Rutas huérfanas** (existen pero muestran una página rota): `/about`, `/services`,
>    `/contact`. Dibújalas en rojo con una advertencia.
> **Marca además, en rojo:** la flecha del menú "Nosotros" → `#intro`, que apunta a un ancla
> **que no existe**, y las anclas `#cuentos` y `#equipo`, a las que **no llega ningún enlace
> del menú**.
> **Estilo:** que se entienda de un vistazo que el menú y la estructura real de la página no
> coinciden del todo.

Las rutas se definen en [`app.routes.ts`](../psyconova-frontend/src/app/app.routes.ts):

| Ruta | Componente | Estado |
|---|---|---|
| `/` | `Home` | ✅ Es todo el sitio |
| `/politica-de-privacidad` | `PrivacyPolicy` | ✅ Funciona (borrador legal) |
| `/terminos-de-uso` | `TermsOfUse` | ✅ Funciona (borrador legal) |
| `/about` | `About` | ⚠️ Muestra `about works!` |
| `/services` | `Services` | ⚠️ Muestra `services works!` |
| `/contact` | `Contact` | ⚠️ Muestra `contact works!` |
| cualquier otra | — | Redirige a `/` sin avisar |

Todas las rutas cuelgan de `MainLayoutComponent`, así que todas heredan navbar, footer y
borde. Todos los componentes se importan de forma directa, no perezosa (`lazy`): con seis
rutas y un solo paquete de 113 kB, dividir no aportaría nada.

El comportamiento del scroll se configura en `app.config.ts`:

```ts
withInMemoryScrolling({
  anchorScrolling: 'enabled',        // que los #fragmentos funcionen
  scrollPositionRestoration: 'top',  // al cambiar de ruta, empezar arriba
})
```

### Defectos conocidos de navegación

Tres cosas que están mal y conviene arreglar juntas:

1. **El menú "Nosotros" apunta a un ancla inexistente.** En `navbar.html` y en
   `hero-section.html` el enlace es `fragment="intro"`, pero ninguna sección tiene
   `id="intro"`; la sección Intro tiene `id="nosotros"`. Al pulsarlo no pasa nada.
2. **Las secciones Cuentos y Equipo no están en el menú.** Existen (`#cuentos`, `#equipo`)
   pero sólo se llega a ellas haciendo scroll.
3. **Los enlaces "¿Qué es PSYCONOVA?" no son enlaces reales.** Están escritos como
   `<a (click)="scrollTo('nosotros')">` sin atributo `href`. Un `<a>` sin `href` no recibe
   foco con el teclado ni se activa con Enter: quien navegue sin mouse no puede usarlo.
   Deberían ser `<button>` o llevar `href`.

## Ciclo de vida de una visita

> **📊 GRÁFICO G-08 — Ciclo de vida de una visita**
> **Va aquí:** debajo de este párrafo, sustituyendo la lista numerada.
> **Tipo:** línea de tiempo horizontal con marcas de tiempo.
> **Debe mostrar:** qué ocurre desde que el visitante pide la página hasta que puede
> interactuar, con los tiempos reales.
> **Hitos, en orden, con su momento:**
> - `0 ms` — El navegador descarga `index.html` (mínimo) y luego `main.js` (113 kB).
> - `~200 ms` — Angular arranca. `App.ngOnInit` desactiva la restauración de scroll del
>   navegador y fuerza `scrollTo(0,0)`.
> - `~200 ms` — En paralelo: `LanguageService` decide el idioma (localStorage → navegador →
>   español) y `ngx-translate` descarga `assets/i18n/es.json`.
> - `~200 ms` — Aparece la **pantalla de carga**, que tapa todo.
> - `~250 ms` — Detrás de la pantalla de carga ya está renderizada la portada.
> - `2400 ms` — La pantalla de carga empieza a desvanecerse (temporizador fijo).
> - `3100 ms` — La pantalla de carga desaparece del DOM. El visitante puede interactuar.
> **Marca en rojo el tramo entre ~250 ms y 3100 ms** con la etiqueta: "El sitio ya está
> listo, pero el visitante no puede verlo ni usarlo: la espera es artificial." Es el punto
> que discute la propuesta P-02.

1. El navegador descarga `index.html`, que casi no tiene contenido: sólo `<app-root>`.
2. Descarga y ejecuta `main.js`. Angular arranca con los providers de `app.config.ts`.
3. `LanguageService` resuelve el idioma inicial: preferencia guardada → idioma del navegador
   → español. Con ese idioma, `ngx-translate` pide `assets/i18n/<idioma>.json` por HTTP.
4. El componente `App` monta la pantalla de carga y el `router-outlet`.
5. `App.ngOnInit` pone `history.scrollRestoration = 'manual'` y hace `scrollTo(0, 0)`, para
   que al recargar la página siempre se empiece desde arriba.
6. La pantalla de carga se retira sola: a los 2400 ms empieza a desvanecerse y a los 3100 ms
   se quita del DOM.

Nota importante sobre el punto 6: **la pantalla de carga no espera a nada.** Son dos
`setTimeout` fijos. No mide si las traducciones llegaron, ni si las imágenes cargaron. En una
conexión rápida el sitio está listo mucho antes y la espera es puro decorado.

## Decisiones técnicas que conviene entender

Estas son las decisiones que un recién llegado cuestionaría, con el motivo real de cada una.

**Todo el contenido en una sola página.** El sitio se lee como una narrativa continua, no
como un catálogo. La contrapartida es de posicionamiento: Google sólo puede indexar una
página, así que no se puede competir por búsquedas distintas ("realidad virtual terapéutica"
y "cuentos terapéuticos" caen en la misma URL). Ver [propuestas](./PROPUESTAS.md).

**El cuento es un archivo HTML suelto, no un componente de Angular.** Está en
`assets/cuentos/las-manadas.html` y se muestra dentro de un `<iframe>`. El comentario del
código explica por qué: *"es una app autocontenida con sus propios estilos y scripts, y así
Laura puede actualizarla sin tocar el sitio"*. Tiene sus propias fuentes, su propia paleta y
su propio JavaScript, todos deliberadamente distintos del sitio.

**El navbar y el hero duplican el menú.** `HeroSection` tiene su propio menú y su propio
selector de idioma, iguales por fuera a los de `Navbar`. Es duplicación real, pero
intencional: sobre el fondo claro del hero, la barra fija con fondo blanco translúcido se
vería mal, así que el hero se pinta su propia versión y el navbar se esconde mientras el
hero está en pantalla. Los dos comparten el idioma a través de `LanguageService`, así que
cambiarlo en cualquiera de los dos se refleja en el otro.

**Los datos de contacto no están traducidos.** Un número de teléfono es el mismo en
cualquier idioma. Meterlo en los archivos de i18n significaría mantener dos copias que
pueden divergir.

**La política de privacidad no está traducida.** Decisión explícita del código: *"es un
documento legal regido por la ley colombiana, así que su versión vinculante es la española.
Traducirlo crearía dos textos que podrían decir cosas distintas."*

**Se usa `zone.js`, no la detección de cambios sin zonas.** `app.config.ts` declara
`provideZoneChangeDetection({ eventCoalescing: true })`. Angular 21 permite trabajar sin
zonas, lo que reduce el paquete y mejora el rendimiento, pero exige que los componentes
usen señales o marquen los cambios a mano. Varios componentes aquí mutan propiedades
directamente desde `setTimeout` y `setInterval`, así que migrar no es gratis.

**`ngIf` y `ngFor` en vez de `@if` y `@for`.** El proyecto usa la sintaxis clásica con
`CommonModule`. Angular 17 introdujo el flujo de control nuevo, que es más rápido y no
necesita imports. Es una migración mecánica y segura, pero todavía no se hizo.

## Estado compartido

Prácticamente no hay. El único dato que viven varios componentes a la vez es **el idioma**,
y lo gestiona `LanguageService` con una señal de Angular:

```ts
private readonly current = signal<Language>(resolveInitialLanguage());
readonly active = this.current.asReadonly();
```

Todo lo demás es estado local de cada componente: si el menú está abierto, si el cuento está
desbloqueado, en qué paso va el envío del formulario. Ninguno de esos datos necesita salir de
su componente, y por eso el proyecto no tiene ni necesita un gestor de estado.

Lo que sí se guarda de forma persistente, en `localStorage` del navegador:

| Clave | Qué guarda | Quién la escribe |
|---|---|---|
| `psyconova.language` | `ES` o `EN` | `LanguageService` |
| `psyconova.mapConsent.v1` | `'1'` si aceptó cargar el mapa | `CtaSection` |

Ambas lecturas y escrituras van envueltas en `try/catch`, porque en modo privado o con las
cookies bloqueadas `localStorage` lanza excepción. El sitio sigue funcionando sin él:
simplemente vuelve a preguntar en cada visita.

---

**Siguiente:** [04 · Sistema de diseño](./04-sistema-de-diseno.md) — colores, tipografía y
patrones visuales.

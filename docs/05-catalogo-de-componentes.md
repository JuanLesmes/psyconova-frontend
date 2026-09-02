# 05 · Catálogo de componentes

Ficha de cada pieza del proyecto: qué hace, qué estado guarda, de qué depende y qué hay que
saber antes de tocarla.

**Convención de nombres del proyecto:** los archivos no llevan sufijo (`home.ts`, no
`home.component.ts`), pero las clases sí describen su tipo cuando hace falta
(`MainLayoutComponent`, `FooterComponent`). No es del todo consistente — `Navbar` y `Home`
no llevan sufijo — pero así está y conviene seguirlo.

---

# Núcleo

## `App` — componente raíz

📁 [`app.ts`](../psyconova-frontend/src/app/app.ts) · selector `app-root`

Lo más simple del proyecto. Su plantilla completa son dos líneas: la pantalla de carga y el
`router-outlet`.

Lo único que hace en `ngOnInit`:

```ts
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
```

Esto desactiva la restauración automática de scroll del navegador. Sin ello, al recargar la
página el navegador te devolvería a la mitad del sitio, pero con la pantalla de carga
encima, lo que se ve como un salto brusco al desaparecer. Con esto, cada carga empieza
arriba.

Ese `window.scrollTo` es el que produce el aviso `Not implemented: Window's scrollTo()
method` al correr las pruebas. Es inocuo.

## `appConfig` — configuración global

📁 [`app.config.ts`](../psyconova-frontend/src/app/app.config.ts)

Los cinco providers de la aplicación:

| Provider | Para qué |
|---|---|
| `provideBrowserGlobalErrorListeners()` | Captura errores no manejados y los reporta a la consola |
| `provideZoneChangeDetection({ eventCoalescing: true })` | Detección de cambios con `zone.js`, agrupando eventos seguidos |
| `provideRouter(routes, withInMemoryScrolling(…))` | Rutas + scroll a anclas + volver arriba al cambiar de ruta |
| `provideHttpClient()` | Necesario para cargar los archivos de traducción y enviar el formulario |
| `provideTranslateService({…})` | Traducciones; carga `assets/i18n/<idioma>.json` |

El idioma inicial se resuelve **antes** de arrancar, llamando a `resolveInitialLanguage()`
desde la propia configuración. Así el primer render ya sale en el idioma correcto y no se ve
un parpadeo de español a inglés.

---

# Capa `core/`

## `LanguageService`

📁 [`core/services/language.service.ts`](../psyconova-frontend/src/app/core/services/language.service.ts)

El único estado compartido del proyecto. Es la fuente de verdad del idioma activo.

**API pública:**

| Miembro | Tipo | Qué es |
|---|---|---|
| `languages` | `readonly ['ES', 'EN']` | La lista de idiomas disponibles |
| `active` | `Signal<Language>` | Señal de sólo lectura con el idioma actual |
| `use(language)` | método | Cambia el idioma |

**Funciones sueltas exportadas** (están fuera de la clase porque `app.config.ts` las
necesita antes de que exista el inyector):

- `resolveInitialLanguage()` — decide el idioma inicial.
- `toTranslateCode(lang)` — convierte `'ES'` a `'es'`, que es el nombre del archivo.

**Cómo decide el idioma inicial**, en orden:

1. Lo que haya en `localStorage` bajo `psyconova.language`.
2. Los dos primeros caracteres de `navigator.language`, si son `ES` o `EN`.
3. Español.

Al cambiar el idioma hace tres cosas: actualiza la señal, llama a `translate.use(code)` y
pone `document.documentElement.lang = code` (importante para lectores de pantalla y para los
buscadores). Después intenta guardarlo en `localStorage`.

**Todos los accesos a `localStorage` van en `try/catch`.** En modo privado o con el
almacenamiento bloqueado, leer o escribir lanza una excepción. Sin persistencia el idioma
sigue funcionando durante la sesión; simplemente no se recuerda.

## `ContactService`

📁 [`core/services/contact.service.ts`](../psyconova-frontend/src/app/core/services/contact.service.ts)

Una sola responsabilidad: hacer `POST` de la consulta al destino configurado.

```ts
send(request: ContactRequest): Observable<unknown>
get isConfigured(): boolean
```

El servicio **no sabe** a dónde envía: la URL está en `CONTACT_ENDPOINT`, en
`core/config/contact.config.ts`. Esa separación es a propósito — si mañana se cambia de
Netlify a un backend propio, se toca una constante y ni el servicio ni el componente se
enteran.

Si `CONTACT_ENDPOINT` está vacío, `send()` devuelve un error en vez de fingir que envió.
Ese principio se repite en todo el flujo de contacto y es deliberado: **nunca se le dice al
visitante que su consulta llegó si no llegó.**

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

⚠️ **Sobre `CRISIS_LINES`, lee el comentario del archivo antes de tocar nada.** Los números
(106, 192, 123) están verificados contra minsalud.gov.co y saludcapital.gov.co en agosto de
2026. *Un número equivocado en una línea de crisis es peor que no tener ninguna.* Si hay que
cambiarlos, confírmalo primero con la fuente oficial.

`MAP_CONSENT_KEY` termina en `.v1` por un motivo: si el texto del aviso de consentimiento
cambia de forma sustancial, hay que subir la versión (`.v2`) para volver a pedir permiso a
quienes ya lo habían dado sobre un texto distinto.

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

Sirve para lo que probablemente se busca — que el cuento se entregue en consulta y no quede
suelto para cualquiera que pase — pero no para proteger algo que de verdad no pueda verse.
Si hiciera falta control real, el camino es una función serverless que valide la clave en el
servidor.

`normalizeCode()` prepara lo que escribe el usuario antes de comparar: quita espacios
sobrantes, pasa a minúsculas, elimina tildes (`NFD` + `\p{Diacritic}`) y colapsa espacios
múltiples. Así, escribir `"Manáda"` o `"  las   manadas "` funciona igual. El comentario
explica por qué se usa `\p{Diacritic}` y no un rango de caracteres: *"un rango de
combinantes son símbolos invisibles en el código, imposibles de revisar"*.

---

# Capa `layout/`

## `MainLayoutComponent`

📁 [`layout/main-layout/`](../psyconova-frontend/src/app/layout/main-layout/)

Envuelve todas las rutas. Su plantilla completa:

```html
<div class="site-frame">
  <div class="site-frame__border"></div>
  <app-navbar></app-navbar>
  <main class="main-layout"><router-outlet></router-outlet></main>
  <app-footer></app-footer>
</div>
```

Sin lógica. El `site-frame__border` es el borde turquesa fijo descrito en
[04 · Sistema de diseño](./04-sistema-de-diseno.md#formas-recurrentes).

## `Navbar`

📁 [`layout/components/navbar/`](../psyconova-frontend/src/app/layout/components/navbar/)

Barra fija superior. Contiene el botón de menú, el logo y el selector `ES / EN`.

> **📊 GRÁFICO G-13 — Estados del navbar según el scroll**
> **Va aquí:** debajo de este párrafo.
> **Tipo:** diagrama de estados, o tres viñetas de la ventana del navegador en posiciones
> distintas de scroll.
> **Debe mostrar:** cuándo se ve la barra y cuándo no. La lógica está en `onWindowScroll()`.
> **Estados que hay que representar:**
> - **A — Dentro del hero** (`heroRect.bottom > 0`): barra **oculta**. El hero pinta su
>   propio menú, así que se verían duplicados.
> - **B — Pasado el hero, bajando** (`scrollY > último + 4`): barra **oculta**. Se aparta
>   para dejar leer.
> - **C — Pasado el hero, subiendo** (`scrollY < último - 4`): barra **visible**. El usuario
>   busca navegar.
> - **D — Menú abierto**: barra **visible siempre**, sin importar el scroll.
> **Anota el umbral de 4 px** con la nota: "evita que el temblor natural del dedo en un
> móvil haga parpadear la barra".
> **Estilo:** dibuja las transiciones entre estados con flechas etiquetadas por la
> condición.

**Estado:**

| Propiedad | Qué guarda |
|---|---|
| `menuOpen` | Si el menú a pantalla completa está abierto |
| `isNavbarVisible` | Si la barra se muestra |
| `lastScrollY` | Posición anterior, para saber la dirección |

**La lógica de `onWindowScroll()`**, en orden de prioridad:

1. Si el menú está abierto → visible, siempre.
2. Si no encuentra el elemento `#home` (es decir, no estamos en la portada) → visible.
3. Si el hero todavía se ve en pantalla → **oculta**.
4. Bajando más de 4 px → oculta. Subiendo más de 4 px → visible.

El margen de 4 px evita que el temblor del scroll en móvil haga parpadear la barra.

`scrollTo(id)` cierra el menú y espera 80 ms antes de desplazarse, para que la animación de
cierre del menú no compita con el scroll.

⚠️ **Problemas conocidos:**
- `@HostListener('window:scroll')` se ejecuta en cada evento de scroll sin limitación. Con
  `zone.js` activo, eso dispara detección de cambios muy a menudo.
- El enlace "¿Qué es PSYCONOVA?" es un `<a>` sin `href`: no es accesible por teclado.
- El enlace "Nosotros" apunta a `fragment="intro"`, un ancla que no existe.

## `FooterComponent`

📁 [`layout/components/footer/`](../psyconova-frontend/src/app/layout/components/footer/)

Pie de página sobre fondo oscuro. Tres columnas (marca, navegación, contacto), un separador
y una barra inferior con el copyright y los enlaces legales.

Lo único que tiene de lógica es `readonly contactInfo = CONTACT_INFO`, para mostrar el
correo desde la configuración central.

⚠️ El enlace de navegación del footer apunta a `fragment="nosotros"` — que **sí** es el ancla
correcta. O sea: el footer navega bien y el navbar no. Al arreglar el navbar, copia lo que
hace el footer.

---

# Secciones de la portada

## `HeroSection`

📁 [`features/home/components/hero-section/`](../psyconova-frontend/src/app/features/home/components/hero-section/) · `#home`

La primera pantalla: ocupa el alto completo de la ventana menos el borde del sitio.

**Contiene una copia del navbar.** Su propia barra superior (logo, botón de menú, selector
de idioma) y su propio menú a pantalla completa. Es duplicación deliberada, explicada en
[03 · Arquitectura](./03-arquitectura.md#decisiones-técnicas-que-conviene-entender): sobre
el fondo claro del hero, la barra fija translúcida se vería mal.

Los dos comparten `LanguageService`, así que cambiar el idioma en cualquiera de los dos se
refleja en el otro de inmediato.

El título se compone de tres claves de traducción para poder resaltar una palabra:

```html
{{ 'hero.titleBefore' | translate }}
<span class="hero-cover__title-accent">{{ 'hero.titleAccent' | translate }}</span>
{{ 'hero.titleAfter' | translate }}
```

Resultado: "Una nueva **mirada** para la salud mental."

⚠️ Si tocas el menú del navbar, **tienes que tocar también el del hero**. Están duplicados y
nada avisa si divergen.

## `IntroSection`

📁 [`features/home/components/intro-section/`](../psyconova-frontend/src/app/features/home/components/intro-section/) · `#nosotros`

La pieza más compleja del sitio: la "constelación" o "sinapsis".

> **📊 GRÁFICO G-14 — Anatomía de la constelación de la sección Intro**
> **Va aquí:** debajo de este párrafo.
> **Tipo:** diagrama técnico anotado de la composición, con dos sistemas de coordenadas
> superpuestos.
> **Debe mostrar:** cómo conviven dos capas que usan unidades distintas:
> - **Capa SVG** (`viewBox="0 0 1000 760"`): las líneas y los puntos. Usa `lineX`/`lineY` en
>   coordenadas del viewBox.
> - **Capa HTML** (posicionamiento absoluto en %): los siete botones de nodo. Usan `x`/`y`
>   en porcentaje.
> **Anota la conversión, que es la clave del componente:**
> `lineX = x × 10` y `lineY = y × 7.6` (porque el viewBox mide 1000 × 760).
> **Dibuja los siete nodos en sus posiciones reales**, con su `id` y su porcentaje:
> `problema` (23 %, 21 %) · `que-es` (50 %, 10 %) · `tecnologia` (77 %, 21 %) ·
> `exploracion` (13 %, 50 %) · `acceso` (87 %, 50 %) · `impacto` (26 %, 83 %) ·
> `bienestar` (74 %, 83 %).
> **Marca el centro** en (500, 380) del SVG, que es el portal con la imagen.
> **Añade una nota de advertencia:** "si mueves un nodo, tienes que actualizar los cuatro
> números a mano. No hay nada que los mantenga sincronizados."

**Dos comportamientos a la vez:**

**1. Bucle de imágenes en reposo.** Cuando nadie interactúa, el portal central rota tres
imágenes cada 3200 ms con un fundido cruzado. Para el fundido mantiene a la vez la imagen
anterior y la actual, y borra la anterior a los 980 ms (la transición dura menos).

**2. Nodos interactivos.** Siete botones alrededor del centro. Al pasar el mouse o enfocar
uno: se ilumina su línea al centro, aparecen dos pulsos viajeros, y el portal central cambia
a la imagen de ese nodo. El bucle se pausa mientras haya un nodo activo
(`if (this.activeId) return;` dentro del intervalo).

Al salir del nodo, `clearActiveDelayed()` espera **110 ms** antes de volver al bucle. Sin
esa espera, mover el mouse de un nodo a otro produciría un parpadeo del portal.

**Los tres temporizadores** (`loopIntervalId`, `cleanupTimeoutId`, `clearDelayId`) se
limpian en `ngOnDestroy`. Está bien hecho; si añades otro, acuérdate de limpiarlo también.

**Sobre el SVG:** el degradado usa `gradientUnits="userSpaceOnUse"` y el comentario del
código explica por qué — con el valor por defecto (`objectBoundingBox`), una línea
perfectamente horizontal o vertical tiene una dimensión de cero y el degradado no se ve.
Las líneas en reposo usan color sólido por el mismo motivo.

⚠️ **Este componente es de escritorio.** Toda la interacción está pensada para mouse
(`mouseenter`, `mouseleave`). En móvil hay `(click)` pero no hay forma de cerrar el nodo
activo salvo tocando otro.

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

🔒 **Bloque desactivado:** la galería "Entornos VR" (cuatro entornos: costa, submarino,
bosque, montaña) está comentada en el HTML y en el TypeScript, a la espera de imágenes. El
comentario deja la instrucción para reactivarla: *"Al reactivarlo, mover los `label` a
assets/i18n/*.json bajo `services.environments`"*.

## `StoriesSection`

📁 [`features/home/components/stories-section/`](../psyconova-frontend/src/app/features/home/components/stories-section/) · `#cuentos`

Fondo oscuro. Presenta el cuento *Las Manadas* y lo desbloquea con una palabra clave.

> **📊 GRÁFICO G-15 — Estados del componente de cuentos**
> **Va aquí:** debajo de este párrafo.
> **Tipo:** diagrama de dos estados con las transiciones entre ellos.
> **Debe mostrar:**
> - **Estado BLOQUEADO** (`unlocked = false`): el `<iframe>` con la portada del cuento **sí
>   está cargado y animándose**, pero encima tiene una capa (`.tale__veil`) que intercepta
>   todos los toques, con una insignia de candado. A la derecha, el formulario de la palabra
>   clave.
> - **Estado DESBLOQUEADO** (`unlocked = true`): la capa desaparece; el iframe se vuelve
>   interactivo. El formulario se sustituye por un botón "Abrir el cuento" que abre el
>   archivo en una pestaña nueva.
> - **Transición**: escribir la palabra clave → `submitCode()` → `isValidTaleCode()`.
>   Si falla, aparece el mensaje de error y **no** cambia de estado.
> **Anota en grande:** "Al recargar la página vuelve al estado bloqueado. El desbloqueo dura
> sólo la visita: no se guarda en ninguna parte, y es a propósito."

**Estado:** `unlocked`, `code`, `wrongCode`. Nada más.

El detalle bonito del diseño: mientras está bloqueado, **la portada del cuento se ve y se
anima**; lo que hay encima es una capa transparente que intercepta los toques. Así el
visitante entiende qué es lo que está bloqueado.

El desbloqueo **no se persiste**, y el comentario del código insiste en que es a propósito:
al recargar vuelve a pedirse la palabra.

`taleFrameUrl` pasa por `DomSanitizer.bypassSecurityTrustResourceUrl()` porque Angular
bloquea las URL de `[src]` en un iframe. Aquí es seguro: la URL es una constante del propio
proyecto, no viene del usuario.

## `TeamSection`

📁 [`features/home/components/team-section/`](../psyconova-frontend/src/app/features/home/components/team-section/) · `#equipo`

Fondo claro. Perfil de la directora clínica: foto en marco de arco, nombre, credenciales,
biografía, siete especialidades como etiquetas y su formación académica.

El TypeScript sólo guarda la foto y las claves de las especialidades. Todo el texto está en
i18n bajo `team.lead`.

🔒 **Bloque oculto:** la sección "Equipo interdisciplinario" con tres perfiles (tecnología,
legal, marketing) está comentada. **Sus textos siguen en los archivos de idioma** bajo
`team.members`, con nombres de relleno como "Nombre del Líder". Si algún día se activa sin
reemplazarlos, esos nombres saldrían publicados.

## `CtaSection` — la sección de contacto

📁 [`features/home/components/cta-section/`](../psyconova-frontend/src/app/features/home/components/cta-section/) · `#contact`

La sección más grande del proyecto (796 líneas de SCSS, la que dispara el aviso de
presupuesto). Contiene cuatro cosas: el aviso de crisis, el formulario, las tarjetas de
información y el mapa.

Está documentada por completo en [07 · Formulario de contacto](./07-formulario-de-contacto.md).
Lo esencial:

- **El aviso de crisis va primero**, antes del formulario. No lo muevas.
- **El botón de envío está deshabilitado hasta marcar el consentimiento.**
- **Nunca se finge un envío exitoso**: si falla, se muestra el error con el correo como
  alternativa.
- **El mapa no se carga hasta que el visitante lo autoriza.** El `<iframe>` ni siquiera
  existe en el DOM antes de eso, así que ninguna petición sale a Google.

---

# Capa `shared/`

## `LoadingScreen`

📁 [`shared/components/loading-screen/`](../psyconova-frontend/src/app/shared/components/loading-screen/)

Pantalla de carga sobre fondo oscuro: tres anillos girando, el logo, el lema y una barra de
progreso.

```ts
ngOnInit(): void {
  this.hideTimer = setTimeout(() => {
    this.hiding = true;
    this.removeTimer = setTimeout(() => { this.visible = false; }, 700);
  }, 2400);
}
```

⚠️ **Los tiempos son fijos y no miden nada.** No espera a las traducciones, ni a las
imágenes, ni a nada. Son 2400 ms de espera más 700 ms de desvanecido, siempre, incluso si el
sitio ya está listo en 300 ms. Es la primera impresión del visitante y son tres segundos en
los que no puede hacer nada. Ver la propuesta P-02.

Lleva `aria-hidden="true"` para que los lectores de pantalla no la anuncien, pero eso no
resuelve que tape el contenido.

## `RevealDirective`

📁 [`shared/directives/reveal.directive.ts`](../psyconova-frontend/src/app/shared/directives/reveal.directive.ts)

Documentada en [04 · Sistema de diseño](./04-sistema-de-diseno.md#la-animación-de-aparición-reveal).

## `PrimaryButton` y `SectionTitle`

📁 `shared/components/primary-button/` y `shared/components/section-title/`

**Están vacíos y nadie los usa.** Son restos de la generación inicial con Angular CLI: la
clase no tiene nada, el HTML dice `primary-button works!` y el SCSS está vacío. Cada uno
tiene además un archivo de pruebas que sólo comprueba que el componente se puede crear —
esos son 2 de los 8 tests del proyecto.

Dos caminos válidos: borrarlos, o implementarlos de verdad extrayendo los botones e
insignias que hoy están duplicados en cada sección. Lo que no tiene sentido es dejarlos
así.

---

# Páginas

## `Home`

📁 [`features/home/pages/home/`](../psyconova-frontend/src/app/features/home/pages/home/)

Cero lógica. Su plantilla completa son seis etiquetas:

```html
<app-hero-section></app-hero-section>
<app-intro-section></app-intro-section>
<app-services-section></app-services-section>
<app-stories-section></app-stories-section>
<app-team-section></app-team-section>
<app-cta-section></app-cta-section>
```

**Para reordenar las secciones del sitio, este es el único archivo que hay que tocar.**

## `PrivacyPolicy` y `TermsOfUse`

📁 [`features/legal/pages/`](../psyconova-frontend/src/app/features/legal/pages/)

Documentos legales. El texto va **directo en la plantilla**, no en i18n, y el comentario del
código explica por qué: es un documento regido por la ley colombiana, su versión vinculante
es la española, y traducirlo crearía dos textos que podrían decir cosas distintas.

Los dos comparten `../../legal.scss`.

⚠️ **Los dos llevan un aviso visible de "Documento en revisión"**, con la instrucción en un
comentario del HTML: *"quitar este bloque cuando la abogada valide el texto"*. Mientras el
aviso siga ahí, el documento no es definitivo. Ver [10 · Privacidad y legal](./10-privacidad-y-legal.md).

## `About`, `Services`, `Contact`

📁 `features/{about,services,contact}/pages/`

**Vacías.** Muestran `about works!`, `services works!` y `contact works!`. Sus SCSS están en
0 bytes. Son accesibles escribiendo la URL: `psyconova.com/services` muestra hoy una página
rota.

Tres opciones, todas mejores que dejarlo así: quitarlas de `app.routes.ts`, hacer que
redirijan al ancla correspondiente de la portada, o construirlas de verdad. Ver la propuesta
P-03.

---

**Siguiente:** [06 · Internacionalización](./06-internacionalizacion.md) — cómo funcionan
los idiomas.

# 04 · Sistema de diseño

Este documento describe el lenguaje visual **tal como está implementado**, no como debería
estar. Hay una diferencia importante entre los dos y conviene conocerla antes de tocar
cualquier estilo.

## La advertencia que hay que leer primero

El proyecto tiene un archivo de tokens de diseño,
[`src/styles/_variables.scss`](../psyconova-frontend/src/styles/_variables.scss), con
variables como `--color-primary`. **Ese archivo casi no se usa, y los valores que define no
coinciden con los colores reales del sitio.**

Los números:

| | Usos |
|---|---|
| `var(--color-*)` dentro de componentes | **11** |
| Colores escritos a mano (`#19206d`, `#72dfd1`…) | **160** |

Y los valores divergen:

| Token | Valor declarado | Color realmente usado | ¿Coinciden? |
|---|---|---|---|
| `--color-primary-dark` | `#16205A` | `#19206d` (34 usos) | No |
| `--color-primary` | `#67CECF` | `#72dfd1` (24 usos) | No |
| `--color-accent-soft` | `#BB99E7` | `#c8b2f7` (10 usos) | No |
| `--color-text-soft` | `#51608d` | `#5f677e` (11 usos) | No |
| `--color-accent` | `#67E5BF` | sólo en el fondo del hero | Parcial |

**Consecuencia práctica: cambiar un valor en `_variables.scss` no cambia el sitio.** Si
alguien lo intenta esperando un cambio global, no pasará casi nada. La paleta que manda es
la de la tabla siguiente.

Las tipografías sí van por variable (18 usos de `--font-body` y `--font-display`, ninguno
escrito a mano), así que ahí el sistema funciona.

Unificar esto está propuesto como mejora técnica (P-11 en [PROPUESTAS](./PROPUESTAS.md)),
pero mientras no se haga: **al escribir estilos nuevos, usa los colores de la tabla de
abajo, no los tokens.** Es preferible ser consistente con lo que hay que crear un tercer
sistema.

## La paleta real

> **📊 GRÁFICO G-09 — Paleta de color real y dónde se usa cada tono**
> **Va aquí:** justo debajo de este párrafo, sustituyendo o acompañando la tabla.
> **Tipo:** muestrario de color. Una fila por tono: un cuadrado grande de color, el código
> hex, el nombre, y a la derecha una lista de dónde se usa.
> **Debe mostrar:** los ocho colores de la tabla de abajo. Para cada uno, indica sobre qué
> fondo se usa (claro u oscuro) — es lo que determina si el contraste funciona.
> **Añade una fila aparte, marcada con un símbolo de advertencia:** el par `#0f8f84` sobre
> fondo claro, con la nota "contraste 3,7:1 — por debajo del 4,5:1 que exige WCAG AA para
> texto pequeño".
> **Estilo:** agrupa visualmente en dos bloques: "para fondos oscuros" y "para fondos
> claros". Es la distinción que de verdad importa al elegir un color aquí.

| Color | Hex | Nombre de uso | Dónde aparece |
|---|---|---|---|
| ⬛ | `#19206d` | Azul tinta | Texto principal, fondos oscuros, base de degradados |
| 🟦 | `#0d1340` | Azul noche | Fondo oscuro de Servicios, Cuentos y footer |
| ⬛ | `#0e0a2e` | Casi negro violáceo | Extremos de los degradados oscuros |
| 🟩 | `#72dfd1` | Turquesa | Acento sobre fondo **oscuro**: insignias, iconos, líneas |
| 🟩 | `#0f8f84` | Verde azulado oscuro | El mismo acento, pero sobre fondo **claro** |
| 🟪 | `#7b69e7` | Violeta | Acentos secundarios, botones, detalles del correo |
| 🟪 | `#c8b2f7` | Lavanda | Acento suave sobre fondo oscuro, degradados |
| ⬜ | `#5f677e` | Gris azulado | Texto secundario sobre fondo claro |

Fíjate en el par `#72dfd1` / `#0f8f84`: **son el mismo color conceptual en dos versiones.**
El turquesa claro se lee muy bien sobre fondo oscuro (contraste 9:1) pero es ilegible sobre
fondo claro (1,4:1). Por eso las insignias de las secciones oscuras usan `#72dfd1` y las de
las secciones claras usan `#0f8f84`. No es un descuido: es una adaptación consciente. Si
añades un elemento con acento, elige la versión según el fondo.

(La versión oscura, `#0f8f84`, se queda de todos modos en 3,7:1 sobre los fondos claros del
sitio, que no alcanza el 4,5:1 de WCAG AA para texto pequeño. Está recogido en las
propuestas como P-08.)

## Ritmo claro-oscuro

> **📊 GRÁFICO G-10 — Ritmo claro-oscuro de las secciones**
> **Va aquí:** debajo de este párrafo.
> **Tipo:** franja vertical continua que represente la página completa, dividida en los
> siete bloques, cada uno pintado con su degradado real.
> **Debe mostrar:** la alternancia. De arriba a abajo:
> `Hero` claro → `Intro` claro → `Servicios` **oscuro** → `Cuentos` **oscuro** →
> `Equipo` claro → `Contacto` claro → `Footer` **oscuro**.
> **Anota al lado de cada bloque** su degradado real (los valores están en la tabla de
> abajo) y el color de acento que le corresponde (`#72dfd1` en los oscuros, `#0f8f84` en los
> claros).
> **Estilo:** debe verse como una tira de color continua. El objetivo es que quien lo mire
> entienda de inmediato la regla "los oscuros van juntos en el medio y al final".

Ninguna sección tiene un fondo plano. Todas se construyen igual: dos o tres degradados
radiales de color muy tenue superpuestos sobre un degradado lineal vertical.

```scss
background:
  radial-gradient(ellipse at 80% 10%, rgba(114, 223, 209, 0.14) 0%, transparent 40%),
  radial-gradient(ellipse at 10% 80%, rgba(200, 178, 247, 0.18) 0%, transparent 40%),
  linear-gradient(180deg, #0d1340 0%, #19206d 55%, #0e0a2e 100%);
```

Los radiales siempre usan los mismos dos colores con opacidad muy baja: turquesa
(`rgba(114,223,209, …)`) y lavanda (`rgba(200,178,247, …)`). Lo que cambia entre secciones
es la posición y la opacidad. Esa repetición es lo que da unidad visual al sitio.

| Sección | Degradado lineal | Tono |
|---|---|---|
| Hero | `#f8f7f4 → #e8f4f5 → #b8dce3` | Claro |
| Intro | `#ffffff → #fbfaff → #f5f0ff → #ede3ff` | Claro |
| Servicios | `#0d1340 → #19206d → #0e0a2e` | **Oscuro** |
| Cuentos | `#0e0a2e → #161c58 → #0d1340` | **Oscuro** |
| Equipo | `#f7f4ff → #ffffff → #f0f8ff` | Claro |
| Contacto | `#ffffff → #f7f4ff → #ede8ff` | Claro |
| Footer | `#0d1340 → #080b26` | **Oscuro** |
| Pantalla de carga | `#0d1340 → #19206d → #0a0826` (145°) | **Oscuro** |

Varias secciones oscuras añaden encima una textura de puntos casi invisible:

```scss
background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
background-size: 48px 48px;
```

## Tipografía

Dos familias, cargadas desde Google Fonts con un `@import` al principio de `styles.scss`:

| Variable | Fuente | Pesos | Para qué |
|---|---|---|---|
| `--font-display` | **Arimo** | 400, 500, 600, 700 | Títulos y encabezados |
| `--font-body` | **Roboto** | 300, 400, 500, 700 | Todo lo demás |

Ambas caen a `Arial, sans-serif` si Google Fonts no responde. Como Arimo es métricamente
compatible con Arial, la caída es casi imperceptible; con Roboto se nota más.

**Detalle de rendimiento:** el `@import` de Google Fonts está dentro del CSS, no como
`<link>` en el `index.html`. Eso significa que el navegador tiene que descargar y analizar
la hoja de estilos antes de descubrir que necesita las fuentes, lo que retrasa el texto.
Moverlo a `index.html` con `<link rel="preconnect">` es una mejora de una línea (P-09).

### Escala de títulos

Todos los títulos usan `clamp()` para escalar con el ancho de pantalla sin necesidad de
media queries:

```scss
font-size: clamp(2rem, 4vw, 3.6rem);
//               ↑mínimo ↑fluido ↑máximo
```

Los valores reales que usa el sitio, de mayor a menor:

| Uso | Valor | En móvil | En escritorio |
|---|---|---|---|
| Título del hero | `clamp(4rem, 8vw, 6.7rem)` | 64 px | 107 px |
| Títulos de sección grandes | `clamp(2.8rem, 6vw, 5.2rem)` | 45 px | 83 px |
| Títulos de sección medios | `clamp(2.8rem, 4.2vw, 4.4rem)` | 45 px | 70 px |
| Título global `.section-title` | `clamp(2rem, 4vw, 3.6rem)` | 32 px | 58 px |
| Subtítulos | `clamp(2rem, 2.8vw, 2.8rem)` | 32 px | 45 px |

Los títulos llevan siempre `letter-spacing: -0.03em` y `line-height` cercano a 1,04. Es un
tratamiento tipográfico consistente en todo el sitio: títulos muy grandes, muy juntos y con
las letras algo apretadas.

## Anatomía de una sección

> **📊 GRÁFICO G-11 — Anatomía de una sección tipo**
> **Va aquí:** debajo de este párrafo, antes del bloque de código.
> **Tipo:** wireframe anotado de una sola sección, con llamadas numeradas.
> **Debe mostrar:** la estructura que repiten todas las secciones, con el nombre de clase
> CSS de cada parte.
> **Partes que hay que etiquetar, de arriba a abajo:**
> 1. `<section class="xxx" id="ancla">` — el contenedor, con su degradado de fondo.
> 2. `.xxx::before` — la textura de puntos superpuesta (sólo en secciones oscuras).
> 3. `.xxx-glow` / `.xxx-ring` — formas decorativas absolutas, siempre con `aria-hidden`.
> 4. `.xxx-shell` — el contenedor que centra y limita el ancho del contenido.
> 5. `.xxx-header` — insignia + título + subtítulo. Lleva el atributo `reveal`.
> 6. El contenido propio de la sección.
> **Anota el prefijo:** cada sección usa un prefijo de tres o cuatro letras para todas sus
> clases: `svc-` en Servicios, `ctc-` en Contacto, `story-` en Cuentos, `team-` en Equipo,
> `intro-` en Intro. Es lo que evita colisiones entre hojas de estilo.

Todas las secciones siguen el mismo esqueleto:

```html
<section class="svc" id="services">
  <div class="svc-glow" aria-hidden="true"></div>   <!-- decoración -->

  <div class="svc-shell">                            <!-- contenedor centrado -->
    <div class="svc-header" reveal revealType="up">
      <span class="svc-badge">Nuestros Servicios</span>
      <h2 class="svc-title" [innerHTML]="'services.title' | translate"></h2>
      <p class="svc-intro">…</p>
    </div>

    <!-- contenido propio -->
  </div>
</section>
```

Convenciones que se cumplen sin excepción:

- **Prefijo por sección.** Cada sección tiene su prefijo (`svc-`, `ctc-`, `story-`,
  `team-`, `intro-`, `hero-cover__`, `footer__`, `ls-`) y todas sus clases lo llevan. Como
  los estilos de Angular están encapsulados por componente, el prefijo no es estrictamente
  necesario, pero hace que buscar en el código sea trivial.
- **Todo lo decorativo lleva `aria-hidden="true"`.** Anillos, resplandores, texturas. Un
  lector de pantalla no debe anunciarlos.
- **La cabecera siempre es insignia + título + subtítulo**, y siempre lleva `reveal`.
- **Los títulos con salto de línea usan `[innerHTML]`.** Por ejemplo
  `"title": "Realidad virtual<br>para el bienestar"`. El `<br>` viene dentro del texto
  traducido. Es la única razón por la que se usa `innerHTML` en el proyecto; ver la nota de
  seguridad en [06 · Internacionalización](./06-internacionalizacion.md#sobre-innerhtml).

## Estilos globales

En [`styles.scss`](../psyconova-frontend/src/styles.scss) vive lo poco que es global:

| Clase | Qué hace |
|---|---|
| `.container` | `width: min(1280px, calc(100% - 7rem))` centrado. En móvil pasa a `100% - 2rem`. |
| `.section` | `padding: 5rem 0` |
| `.section-tag` | Insignia genérica en mayúsculas con `letter-spacing: 0.2em` |
| `.section-title` | Título genérico con la escala `clamp` |
| `.btn`, `.btn--primary`, `.btn--ghost` | Botones tipo píldora de 48 px de alto |

En la práctica **las secciones no usan estas clases**: cada una se define las suyas con su
prefijo. Las globales sobreviven de una etapa anterior del proyecto. No las borres sin
comprobarlo, pero tampoco esperes que cambiarlas afecte a la portada.

`_reset.scss` es mínimo: `box-sizing: border-box`, quitar márgenes de encabezados y
párrafos, `img { max-width: 100%; display: block }`, quitar el subrayado de los enlaces, y
`scroll-behavior: smooth` en `html` (que es lo que hace que los saltos de ancla sean
suaves).

## Formas recurrentes

| Forma | Valor | Dónde |
|---|---|---|
| Píldora | `border-radius: 999px` (22 usos) | Insignias, botones, etiquetas |
| Círculo | `border-radius: 50%` (11 usos) | Iconos, puntos, anillos decorativos |
| Tarjeta | `border-radius: 18px` a `28px` | Tarjetas de servicio, de contacto, de equipo |
| Marco de foto | Arco (radio grande arriba, pequeño abajo) | Foto del equipo, portal de Intro |

El **borde del sitio** merece mención aparte. En `main-layout.scss`:

```scss
.site-frame__border {
  position: fixed;
  inset: var(--frame-gap);       /* 10px en escritorio, 8px en móvil */
  border: 1.6px solid rgba(103, 206, 207, 0.55);
  pointer-events: none;
  z-index: 40;
}
```

Es un rectángulo turquesa fijo que enmarca toda la ventana, siempre visible por encima del
contenido. Es la firma visual del sitio. `pointer-events: none` es imprescindible: sin eso,
bloquearía todos los clics de la página.

## La animación de aparición (reveal)

> **📊 GRÁFICO G-12 — Cómo funciona la animación de aparición**
> **Va aquí:** debajo de este párrafo, antes del ejemplo de uso.
> **Tipo:** secuencia de tres viñetas horizontales que muestran la ventana del navegador y
> un elemento acercándose al borde inferior.
> **Debe mostrar:**
> - **Viñeta 1:** el elemento está fuera de la pantalla, debajo. Etiqueta: "clases `reveal`
>   y `reveal--up` aplicadas. `opacity: 0`, desplazado 48 px hacia abajo."
> - **Viñeta 2:** el elemento cruza el umbral. Dibuja una línea horizontal punteada 50 px por
>   encima del borde inferior de la ventana, etiquetada `rootMargin: 0 0 -50px 0`. Etiqueta:
>   "el IntersectionObserver dispara cuando el 12 % del elemento cruza la línea."
> - **Viñeta 3:** el elemento está visible y en su sitio. Etiqueta: "se añade `is-visible`.
>   Transición de 0,75 s. **El observador deja de vigilarlo: la animación no se repite.**"
> **Añade abajo una nota destacada:** "No hay soporte de `prefers-reduced-motion`. Quien
> tenga activada la reducción de movimiento en su sistema ve todas las animaciones igual."

La directiva [`reveal.directive.ts`](../psyconova-frontend/src/app/shared/directives/reveal.directive.ts)
es la única pieza de animación compartida del proyecto. Se usa como atributo:

```html
<div reveal revealType="up" [revealDelay]="150">…</div>
```

| Entrada | Valores | Por defecto |
|---|---|---|
| `revealType` | `up`, `down`, `left`, `right`, `scale`, `fade` | `up` |
| `revealDelay` | milisegundos | `0` |
| `revealThreshold` | 0 a 1, cuánto del elemento debe verse | `0.12` |

Cómo funciona: al inicializarse añade las clases `reveal` y `reveal--<tipo>` (que ponen
`opacity: 0` y una transformación de 48 px), y crea un `IntersectionObserver`. Cuando el
elemento entra en pantalla, añade `is-visible` y **deja de observarlo**. La animación ocurre
una sola vez por carga de página.

Las transiciones están en `styles.scss`, no en la directiva:

```scss
.reveal {
  opacity: 0;
  transition:
    opacity   0.75s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.75s cubic-bezier(0.4, 0, 0.2, 1),
    filter    0.75s cubic-bezier(0.4, 0, 0.2, 1);
}
```

Para escalonar una lista, calcula el retraso con el índice:

```html
<div *ngFor="let s of services; let i = index" reveal [revealDelay]="i * 130">
```

**Limitación importante:** la directiva no respeta `prefers-reduced-motion`. Para un sitio
de salud mental es una omisión con peso: las animaciones de desplazamiento pueden provocar
malestar a personas con trastornos vestibulares o sensibilidad al movimiento, que es
justamente parte del público. Arreglarlo son unas pocas líneas de CSS (P-07).

## Puntos de quiebre (responsive)

Aquí no hay sistema. El proyecto usa **doce puntos de quiebre distintos** repartidos por las
hojas de estilo:

```
1440, 1200, 1180, 1100, 1024, 980, 960, 900, 860, 768, 640, 600
```

Cada sección eligió los suyos según lo que necesitaba su composición. No hay variables ni
mixins que los agrupen.

En la práctica funciona (el sitio se ve bien en todos los tamaños), pero hace que un cambio
transversal sea tedioso y que sea fácil dejar un hueco entre dos anchos. Los únicos que
aparecen en el sistema "oficial" son `768px` (en `styles.scss` y `_variables.scss`) y
`640px`.

**Si añades estilos responsive nuevos, usa `768px` para el corte móvil y `1024px` para el
de tableta**, salvo que tu composición exija otro. Consolidarlos todos está en las
propuestas (P-11).

## Cómo añadir una sección nueva

1. Crea la carpeta en `features/home/components/mi-seccion/` con sus tres archivos
   (`.ts`, `.html`, `.scss`).
2. Elige un prefijo de clase corto y único (`mi-`).
3. Copia el esqueleto de sección de arriba: `<section class="mi" id="mi-ancla">`, un
   degradado de fondo del tono que toque según el ritmo claro-oscuro, `mi-shell` para el
   contenido, `mi-header` con insignia, título y subtítulo.
4. Pon todos los textos en `assets/i18n/es.json` **y** `en.json`.
5. Añade `reveal` a los bloques que deban aparecer con la animación.
6. Impórtala en `home.ts` y añade la etiqueta en `home.html`, en la posición que le toque.
7. Si debe estar en el menú, añade el enlace en **los dos** menús: `navbar.html` y
   `hero-section.html`.
8. Vigila el presupuesto de 10 kB por hoja de estilos de componente.

---

**Siguiente:** [05 · Catálogo de componentes](./05-catalogo-de-componentes.md) — ficha de
cada pieza.

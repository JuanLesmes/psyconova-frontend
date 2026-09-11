# 08 · Contenido y assets

## Las dos carpetas de imágenes

Este es el concepto que hay que entender antes de tocar cualquier imagen: **hay dos
carpetas, y sólo una llega al navegador. Y sólo una está en Git.**

| Carpeta | Qué contiene | Peso | ¿En Git? | ¿Se publica? |
|---|---|---|---|---|
| `design/source-images/` | Los originales pesados: PNG y JPEG del diseñador | **28 MB** | ❌ No (`.gitignore`) | ❌ No |
| `src/assets/images/` | Los WebP optimizados que genera el script | **~1 MB** | ✅ Sí | ✅ Sí |

La carpeta `design/` completa (`psyconova-frontend/design/`) está en `.gitignore`. Los
originales viven en el disco de quien desarrolla; `npm run optimize:images` los lee de ahí
para generar los WebP, y `scripts/generate-icons.mjs` lee
`design/faviconPsyconova-original.png`. Lo que el repositorio versiona y Angular publica es
sólo `src/assets/`. Un visitante nunca descarga los 28 MB, y quien clone el repositorio sin
los originales puede compilar y trabajar igual: sólo no puede regenerar las imágenes.

El flujo de una imagen: original en `design/source-images/team/laura.jpeg` (3024 × 4032 px,
~1,2 MB) → `npm run optimize:images` (recortar si hay coordenadas, redimensionar, convertir
a WebP) → `src/assets/images/team/laura.webp` (520 × 680 px, ~78 KB) → `ng build` lo copia
a `dist/` → navegador. **El script sobrescribe el destino:** si editas a mano un archivo de
`src/assets/images/`, la siguiente ejecución lo pisa.

## El script de optimización

📁 [`scripts/optimize-images.mjs`](../psyconova-frontend/scripts/optimize-images.mjs)

```bash
npm run optimize:images
```

Usa [`sharp`](https://sharp.pixelplumbing.com/) y está configurado con tres trabajos, uno
por tipo de imagen. Cada uno tiene su tamaño y calidad, elegidos según **dónde se muestra la
imagen en pantalla**:

| Trabajo | Origen → destino | Tamaño | Calidad | Por qué ese tamaño |
|---|---|---|---|---|
| `intro-story` | `intro-story/` | ancho 672 px | 82 | El portal mide 336 × 460 px; al doble cubre pantallas retina |
| `team` | `team/` | 520 × 680 px | 84 | El marco mide 260 × 340 px; al doble cubre retina |
| `branding` | `branding/` | ancho 400 px | 88 | El logo más grande se muestra a 130 px de alto (footer) |

Lee `.png`, `.jpg` y `.jpeg`. Escribe siempre `.webp` con el mismo nombre base. Si una
carpeta de origen no existe (por ejemplo, en una máquina sin `design/`), la salta con un
aviso en vez de fallar.

Al terminar imprime una tabla con el ahorro de cada archivo y el total.

### Recortes manuales

El trabajo `team` tiene una función extra: recortes definidos a mano, en píxeles del
original.

```js
recortes: {
  'laura': { left: 934, top: 1280, width: 1285, height: 1680 },
},
```

El comentario del código explica por qué existe esto:

> *"El recorte automático de sharp no sirvió aquí: dejaba media foto de cielo y la cara abajo
> del encuadre. Con coordenadas explícitas se controla dónde queda el rostro."*

Y deja la instrucción para ajustarlo: *"`top` baja el encuadre, `height` hace zoom (menos
alto = más cerca). La proporción debe ser 520/680 = 0.765."*

La clave del objeto es el nombre del archivo **sin extensión**. Para añadir una foto de otra
persona, se añade su entrada con sus coordenadas.

## Inventario de assets

### Branding: `src/assets/images/branding/` (34 KB)

Un solo archivo, `logoClaroConLetrasSinFondo.webp`, que se usa en la barra de menú (fija y
sobre la portada), el footer y la pantalla de carga. Es también el logo de la ficha de
negocio y la silueta que usa la imagen para redes.

Nota de nomenclatura: "Claro" se refiere al **logo**, no al fondo. El logo "claro" es el
que se ve bien sobre fondos oscuros. Por eso el sitio, que tiene barra clara y footer
oscuro, usa el mismo archivo en los dos: es un logo en tonos claros con transparencia. Las
otras variantes del logo existen sólo como originales en `design/source-images/branding/`.

### Historia visual: `src/assets/images/intro-story/` (872 KB)

Diez imágenes generadas para la sección Intro. Son las más pesadas del sitio.

**Bucle en reposo** (rotan cada 3,2 s en el portal central):

| Archivo | Contenido |
|---|---|
| `01-poniendo-gafas.webp` | Persona iniciando la experiencia |
| `02-gafas-puestas.webp` | Persona con las gafas de realidad virtual |
| `03-transformacion.webp` | Escena de transformación |

**Nodos** (aparecen al señalar cada uno):

| Archivo | Nodo | Metáfora |
|---|---|---|
| `09-desierto.webp` | `problema` | Desgaste y barreras emocionales |
| `04-espacio.webp` | `que-es` | Exploración e innovación |
| `06-volcan.webp` | `tecnologia` | Energía e intensidad |
| `10-biblioteca.webp` | `exploracion` | Autoconocimiento |
| `05-mar.webp` | `acceso` | Accesibilidad y apertura |
| `07-elefante.webp` | `impacto` | Impacto y fuerza |
| `08-bosque.webp` | `bienestar` | Calma y regulación emocional |

Fíjate en que **la numeración de los archivos no coincide con el orden de los nodos**. Los
números son el orden en que se generaron; la asignación a cada nodo está en el array `NODES`
de `intro-section.ts`.

### Equipo: `src/assets/images/team/` (80 KB)

`laura.webp`: la foto de la directora clínica, 520 × 680 px, con el recorte manual
descrito arriba.

### Imagen para redes: `src/assets/images/social/` (33 KB)

`psyconova-og.jpg`, 1200 × 630 px. Es la que muestran WhatsApp, LinkedIn y X al compartir
el enlace; `SeoService` la declara como `og:image` con URL absoluta. La genera
`node scripts/social-image.mjs` con el mismo degradado y los mismos anillos de la pantalla
de carga, y el logo en blanco (toma el canal alfa del logo y lo usa como transparencia de un
rectángulo blanco, que es lo que la pantalla de carga hace con un filtro CSS). Es JPEG y no
WebP porque algunos lectores de enlaces todavía no leen WebP.

### Iconos: `src/assets/icons/` (21 KB)

| Archivo | Tamaño | Peso | Para qué |
|---|---|---|---|
| `favicon-32.png` | 32 × 32 | 1,7 KB | La pestaña del navegador y los marcadores |
| `apple-touch-icon.png` | 180 × 180 | 9 KB | "Añadir a la pantalla de inicio" en iOS |
| `icon-192.png` | 192 × 192 | 10 KB | Lo mismo en Android, y el que usan los buscadores para la ficha |

Los genera `node scripts/generate-icons.mjs` desde `design/faviconPsyconova-original.png`
con paleta indexada (un logo tiene pocos colores planos). No se genera el de 16 px: los
navegadores reducen el de 32 sin que se note. `index.html` los declara con `?v=4` al final
para forzar que el navegador descarte el que tenía en caché.

`public/favicon.ico` (15 KB) es el de la plantilla de Angular; se publica pero no se
referencia.

### Fuentes: `src/assets/fonts/` (196 KB)

| Archivo | Peso | Cuándo se descarga |
|---|---|---|
| `arimo-latin.woff2` | 20 KB | Siempre (precargado) |
| `roboto-latin.woff2` | 43 KB | Siempre (precargado) |
| `arimo-latin-ext.woff2` | 97 KB | Sólo si aparece un carácter fuera del latín básico |
| `roboto-latin-ext.woff2` | 29 KB | Ídem |

Ver la sección "Fuentes" más abajo.

## Imágenes en el HTML

Hay siete etiquetas `<img>` en el proyecto: las tres del portal de Intro, la foto del
equipo, el logo del footer, el de la pantalla de carga y el de la barra de menú.

- **Todas menos la foto del equipo llevan `width` y `height`**, así el navegador reserva el
  espacio y el contenido no salta cuando la imagen carga (lo que Google mide como
  *Cumulative Layout Shift*). La foto del equipo, dentro de su marco de arco, no los lleva.
- **Ninguna lleva `loading="lazy"`.** Los dos `loading="lazy"` del proyecto están en los
  `<iframe>` (el cuento y el mapa). No hace tanta falta como parece: las diez imágenes de
  `intro-story` no están todas en el DOM; el portal pinta con `@if` sólo la imagen actual
  (y la anterior mientras se desvanece), así que las demás se descargan a medida que el
  bucle avanza o se señala un nodo.

Todas las imágenes **sí** tienen texto alternativo, y los de la sección Intro salen del
sistema de traducción (`intro.nodes.<id>.alt`), así que están bien en los dos idiomas. Los
logos que van dentro de un enlace con nombre accesible llevan `alt=""`.

## El cuento interactivo

📁 `src/assets/cuentos/las-manadas.html`: 76 KB, 1195 líneas

*Las Manadas*: la historia de Nilo, un lobito que vive entre dos cuevas cuando su manada
cambia de forma. Está pensado para niños que atraviesan una separación, una familia que se
recompone o la llegada de un hermano. Escrito y diseñado por la directora clínica.

**Es un archivo autónomo, no un componente de Angular.** Un solo HTML con su propio CSS,
su propio JavaScript e ilustraciones en SVG dibujadas dentro del mismo archivo. No importa
nada de fuera y no depende del sitio en absoluto.

Tiene su propio lenguaje visual, deliberadamente distinto del resto:

| | Sitio | Cuento |
|---|---|---|
| Tipografía | Arimo / Roboto | Chalkboard SE / Comic Sans (manuscrita) |
| Paleta | Azul tinta, turquesa, lavanda | Salvia `#9CAF88`, terracota `#C4744A`, crema `#FBF6E9`, miel `#E8B44A` |
| Fondo | Degradados claros y oscuros | Marrón oscuro `#3A342C` |

Contiene 11 páginas ilustradas, 2 actividades para dibujar, navegación con flechas y puntos,
modo pantalla completa y un campo para escribir el nombre del niño en la portada.

**Cómo se integra:** `StoriesSection` lo muestra dentro de un `<iframe>`. Mientras está
bloqueado, una capa transparente encima intercepta los toques, pero la portada se sigue
viendo y animando debajo. Al escribir la palabra clave, la capa desaparece.

**Cómo se actualiza:** se reemplaza el archivo. No hay que compilar nada del cuento ni tocar
código de Angular. Ese es justamente el motivo de no convertirlo en componente: que se
pueda actualizar sin tocar el sitio. Ojo con una cosa: el cuento tiene un script en línea y
la Content Security Policy lo autoriza por su hash, que se recalcula en cada build. Basta
con desplegar después de cambiarlo; no hay que tocar nada más.

**Para añadir un segundo cuento** habría que cambiar `tales.config.ts`, que hoy asume uno
solo (`TALE` es un objeto, no una lista), y `StoriesSection`, que muestra uno fijo. Es un
cambio de una tarde, pero no es "sólo poner el archivo".

⚠️ Recuerda que **la palabra clave no protege de verdad** el cuento: cualquiera puede abrir
`psyconova.com/assets/cuentos/las-manadas.html` directamente. Lo que sí hace el sitio es
dejar `/assets/cuentos/` fuera del índice de los buscadores en `robots.txt`, para que no
aparezca en una búsqueda y llegue a un niño por casualidad, fuera de todo contexto. Ver
[05 · Catálogo](./05-catalogo-de-componentes.md#talesconfigts).

## Cómo añadir una imagen nueva

1. Deja el original (PNG o JPEG, a resolución completa) en la carpeta que corresponda de
   `design/source-images/`, en tu disco.
2. Si necesita un encuadre concreto (típicamente una foto de persona), añade sus
   coordenadas de recorte en `scripts/optimize-images.mjs`.
3. Corre `npm run optimize:images`.
4. Comprueba el resultado en `src/assets/images/`. Ese WebP es lo que se versiona.
5. Referéncialo desde el componente con la ruta `assets/images/…` (sin barra inicial) y
   ponle `width` y `height`.
6. Ponle un `alt` descriptivo. Si es contenido, tradúcelo en los dos archivos de idioma; si
   es decorativo, usa `alt=""`.

Si la imagen va en una carpeta nueva, añade un trabajo al array `JOBS` del script con su
tamaño y calidad. Y guarda el original en algún sitio además de tu disco: al no estar en
Git, si se pierde no hay forma de regenerar el WebP a otro tamaño.

## Fuentes

Arimo y Roboto se sirven **desde el propio dominio**: cuatro archivos woff2 en
`src/assets/fonts/` y sus `@font-face` en `src/styles/_fonts.scss`, que `styles.scss`
incluye con `@use`. Ninguna petición sale a `fonts.googleapis.com` ni a `fonts.gstatic.com`.

Los dos archivos los escribe `scripts/download-fonts.mjs` (`npm run fonts:download`): pide
el CSS a Google Fonts como un navegador moderno (para recibir woff2), descarga sólo los
subconjuntos `latin` y `latin-ext`, y reescribe cada `@font-face` con la URL local,
`font-display: swap` y el `unicode-range` original. Son fuentes variables: Roboto cubre de
300 a 900 en una sola descarga, y Arimo de 400 a 700 (la propia fuente no llega más lejos).

Por qué autoalojarlas, según el propio script:

1. **Privacidad.** Con un `@import` a Google, Google recibía la IP de cada visitante nada
   más abrir la página, antes de que nadie aceptara nada.
2. **Rendimiento.** Un `@import` dentro del CSS encadena dos descargas y bloquea el pintado
   mientras tanto. Aquí `index.html` precarga los dos archivos `latin`.
3. **Salto de maquetación.** Con `swap` y fuentes precargadas, el texto casi no se recompone.

Netlify sirve `/assets/fonts/*` con caché de un año (`immutable`). Los archivos no llevan
hash en el nombre, así que si algún día se regeneran con otro diseño hay que renombrarlos,
o quien ya los tenga verá los viejos durante un año.

## Peso total del sitio

Valores aproximados de la portada, transferidos comprimidos:

| Recurso | Peso transferido |
|---|---|
| HTML prerenderizado de la portada (con el CSS crítico incrustado) | ~117 KB sin comprimir |
| JavaScript inicial | ~118 KB (421 KB sin comprimir) |
| JavaScript diferido (cuentos, equipo, contacto, legales, 404) | Sólo cuando hace falta |
| CSS global | ~1 KB |
| Fuentes (`latin`) | ~63 KB |
| Imágenes | ~1 MB en total, pero sólo la imagen visible del portal se pide al cargar |
| Cuento (sólo si se ve la sección) | 76 KB |

El código está bien: 118 kB de JavaScript inicial para una aplicación de Angular es un
resultado notable, y las secciones inferiores ni siquiera lo descargan hasta que entran en
pantalla. **El peso está en las imágenes de la sección Intro**, que ya están optimizadas;
lo que mantiene ligera la carga inicial es que no se descargan todas de golpe, sino a
medida que el portal las muestra.

---

**Siguiente:** [09 · Despliegue y operación](./09-despliegue-y-operacion.md): cómo llega
esto a internet.

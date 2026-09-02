# 08 · Contenido y assets

## Las dos carpetas de imágenes

Este es el concepto que hay que entender antes de tocar cualquier imagen: **hay dos
carpetas, y sólo una llega al navegador.**

| Carpeta | Qué contiene | Peso | ¿Se publica? |
|---|---|---|---|
| `design/source-images/` | Los originales pesados: PNG y JPEG del diseñador | **28 MB** | ❌ No |
| `src/assets/images/` | Los WebP optimizados que genera el script | **1,1 MB** | ✅ Sí |

Los originales están en el repositorio (se versionan, para no perderlos), pero Angular sólo
publica `src/assets/`. Un visitante nunca descarga los 28 MB.

> **📊 GRÁFICO G-21 — Flujo de una imagen, del original al navegador**
> **Va aquí:** justo debajo de este párrafo.
> **Tipo:** diagrama de tubería (pipeline) horizontal, de izquierda a derecha.
> **Debe mostrar:** los pasos por los que pasa una imagen, con el peso en cada punto.
> **Cajas y flechas:**
> 1. `design/source-images/team/laura.jpeg` — **3024 × 4032 px, ~1,2 MB**. Etiqueta debajo:
>    "el original. Se versiona en Git pero NO se publica."
> 2. Flecha etiquetada `npm run optimize:images` → caja `scripts/optimize-images.mjs`, con
>    tres sub-pasos en vertical dentro: **recortar** (sólo si hay coordenadas definidas) →
>    **redimensionar** → **convertir a WebP**.
> 3. `src/assets/images/team/laura.webp` — **520 × 680 px, ~25 KB**. Etiqueta: "esto sí se
>    publica."
> 4. Flecha etiquetada `ng build` → caja `dist/…/assets/images/team/laura.webp`.
> 5. `Navegador del visitante`.
> **Anota el ahorro en grande sobre la tubería:** "28 MB → 1,1 MB (−96 %)".
> **Añade una advertencia junto al paso 2:** "El script sobrescribe el destino. Si editas a
> mano un archivo de `src/assets/images/`, la siguiente ejecución lo pisa."

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
carpeta de origen no existe, la salta con un aviso en vez de fallar.

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

> **📊 GRÁFICO G-22 — Inventario visual de assets**
> **Va aquí:** debajo de este párrafo, sustituyendo las tres tablas.
> **Tipo:** hoja de contactos / mosaico de miniaturas agrupado por carpeta.
> **Debe mostrar:** las 18 imágenes del sitio en miniatura, agrupadas en tres bloques
> (`branding`, `intro-story`, `team`), cada una con su nombre de archivo debajo.
> **Anota junto a cada miniatura de `branding` dónde se usa**, porque de los siete logos
> **sólo uno se usa en todo el sitio**: `logoClaroConLetrasSinFondo.webp`, en el navbar, el
> hero, el footer y la pantalla de carga. Marca los otros seis como "sin usar".
> **Anota junto a las de `intro-story`** cuáles son del bucle (01, 02, 03) y cuáles de los
> nodos (04 a 10), con el `id` del nodo al que corresponde cada una.

### Branding — `src/assets/images/branding/` (152 KB)

Siete variantes del logo. **Sólo una se usa:**

| Archivo | ¿Se usa? |
|---|---|
| `logoClaroConLetrasSinFondo.webp` | ✅ Navbar, hero, footer y pantalla de carga |
| `logoClaroConLetras.webp` | ❌ |
| `logoClaroSinLetras.webp` | ❌ |
| `logoOscuroConLetras.webp` | ❌ |
| `logoOscuroConLetrasSinFondo.webp` | ❌ |
| `logoOscuroSinLetras.webp` | ❌ |
| `logoSinFondo.webp` | ❌ |

Las seis sin usar pesan poco y tenerlas disponibles es cómodo. Pero conviene saber que
**están ahí y se publican**.

Nota de nomenclatura: "Claro" y "Oscuro" se refieren al **logo**, no al fondo. El logo
"claro" es el que se ve bien sobre fondos oscuros. Por eso el sitio, que tiene navbar claro
y footer oscuro, usa el mismo archivo en los dos: es un logo en tonos claros con
transparencia.

### Historia visual — `src/assets/images/intro-story/` (872 KB)

Diez imágenes generadas para la sección Intro. Son las más pesadas del sitio.

**Bucle en reposo** (rotan cada 3,2 s en el portal central):

| Archivo | Contenido |
|---|---|
| `01-poniendo-gafas.webp` | Persona iniciando la experiencia |
| `02-gafas-puestas.webp` | Persona con las gafas de realidad virtual |
| `03-transformacion.webp` | Escena de transformación |

**Nodos** (aparecen al pasar el mouse por cada uno):

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
números son el orden en que se generaron; la asignación a cada nodo está en el array `nodes`
de `intro-section.ts`.

### Equipo — `src/assets/images/team/` (80 KB)

`laura.webp` — foto de la directora clínica, 520 × 680 px, con el recorte manual descrito
arriba.

### Iconos

| Archivo | Peso | Nota |
|---|---|---|
| `src/assets/icons/faviconPsyconova.png` | **124 KB** | ⚠️ Enorme para un favicon |
| `public/favicon.ico` | 16 KB | El de la plantilla de Angular; no se referencia |

El favicon se declara en `index.html` con `?v=3` al final para forzar que el navegador
descarte el que tenía en caché:

```html
<link rel="icon" type="image/png" sizes="32x40" href="assets/icons/faviconPsyconova.png?v=3">
```

Dos cosas mal aquí: **124 KB para un icono de 32 px es unas cien veces más de lo necesario**
(un PNG optimizado a ese tamaño pesa 1-2 KB), y `sizes="32x40"` no es un tamaño de favicon
válido — los navegadores esperan cuadrados (16×16, 32×32, 180×180). Ninguna de las dos cosas
rompe nada visible, pero las dos son fáciles de arreglar (P-10).

## Imágenes en el HTML

De las diez etiquetas `<img>` del proyecto, **ninguna** tiene `loading="lazy"` ni atributos
`width`/`height`. Los dos `loading="lazy"` que hay están en `<iframe>`, no en imágenes.

Consecuencias:

- Las diez imágenes de `intro-story` se descargan al cargar la página, aunque el visitante
  no llegue nunca a esa sección. Son 872 KB, casi todo el peso del sitio.
- Sin `width`/`height`, el navegador no reserva el espacio y el contenido "salta" cuando la
  imagen carga. Es lo que Google mide como *Cumulative Layout Shift* y penaliza.

Ambas cosas se arreglan con atributos, sin tocar lógica. Está en las propuestas (P-09).

Todas las imágenes **sí** tienen texto alternativo, y los de la sección Intro salen del
sistema de traducción (`intro.nodes.<id>.alt`), así que están bien en los dos idiomas. Eso
está bien hecho.

## El cuento interactivo

📁 `src/assets/cuentos/las-manadas.html` — 76 KB, 1195 líneas

*Las Manadas*: la historia de Nilo, un lobito que vive entre dos cuevas cuando su manada
cambia de forma. Está pensado para niños que atraviesan una separación, una familia que se
recompone o la llegada de un hermano. Escrito y diseñado por Laura Lesmes.

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
código de Angular. Ese fue justamente el motivo de no convertirlo en componente: *"así Laura
puede actualizarla sin tocar el sitio"*.

**Para añadir un segundo cuento** habría que cambiar `tales.config.ts`, que hoy asume uno
solo (`TALE` es un objeto, no una lista), y `StoriesSection`, que muestra uno fijo. Es un
cambio de una tarde, pero no es "sólo poner el archivo".

⚠️ Recuerda que **la palabra clave no protege de verdad** el cuento: cualquiera puede abrir
`psyconova.com/assets/cuentos/las-manadas.html` directamente. Ver
[05 · Catálogo](./05-catalogo-de-componentes.md#talesconfigts).

## Cómo añadir una imagen nueva

1. Deja el original (PNG o JPEG, a resolución completa) en la carpeta que corresponda de
   `design/source-images/`.
2. Si necesita un encuadre concreto (típicamente una foto de persona), añade sus
   coordenadas de recorte en `scripts/optimize-images.mjs`.
3. Corre `npm run optimize:images`.
4. Comprueba el resultado en `src/assets/images/`.
5. Referéncialo desde el componente con la ruta `assets/images/…` (sin barra inicial).
6. Ponle un `alt` descriptivo. Si es contenido, tradúcelo en los dos archivos de idioma; si
   es decorativo, usa `alt=""`.

Si la imagen va en una carpeta nueva, añade un trabajo al array `JOBS` del script con su
tamaño y calidad.

## Fuentes

Arimo y Roboto se cargan desde Google Fonts, con un `@import` en `styles.scss`:

```scss
@import url('https://fonts.googleapis.com/css2?family=Arimo:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap');
```

**No están alojadas en el proyecto.** Implicaciones:

- Si Google Fonts no responde, el sitio cae a Arial. Se ve peor pero funciona.
- Cargar fuentes desde Google implica que el navegador del visitante hace una petición a un
  servidor de Google, que recibe su IP. En Europa eso ha sido objeto de sentencias por
  RGPD; en Colombia el marco es distinto, pero si algún día PSYCONOVA atiende público
  europeo, conviene alojar las fuentes en el propio sitio.
- El `@import` dentro del CSS retrasa la carga. Con un `<link>` en `index.html` más
  `preconnect` el texto aparecería antes.

## Peso total del sitio

| Recurso | Peso transferido |
|---|---|
| JavaScript (`main.js`) | 113,6 KB |
| CSS (`styles.css`) | 2,1 KB |
| Imágenes (todas) | ~1,1 MB |
| Cuento (sólo si se ve) | 76 KB |
| Fuentes (Google) | ~50 KB |

El código está muy bien: 115 KB para una aplicación de Angular es un resultado notable. **El
peso está en las imágenes**, y ahí la mejora no es comprimir más (ya están optimizadas) sino
no descargarlas todas de golpe. Con `loading="lazy"` en las de `intro-story`, la carga
inicial bajaría de ~1,2 MB a unos 300 KB.

---

**Siguiente:** [09 · Despliegue y operación](./09-despliegue-y-operacion.md) — cómo llega
esto a internet.

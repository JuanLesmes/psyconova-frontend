# 02 · Primeros pasos

Este documento te lleva de "acabo de clonar el repositorio" a "hice un cambio y lo vi en
pantalla". Si algo falla, la última sección tiene los problemas conocidos.

## Requisitos

| Herramienta | Versión | Por qué esa |
|---|---|---|
| **Node.js** | 24.x | Es la versión con la que se desarrolló y la que usa Netlify para compilar. Angular 21 también acepta 20.19+ o 22.12+, pero conviene usar la misma que producción. |
| **npm** | 11.x | Viene con Node 24. El proyecto fija `"packageManager": "npm@11.6.2"`. |
| **Git** | cualquiera reciente | — |
| **Un editor** | VS Code recomendado | El repositorio trae configuración de VS Code lista. |

Verifica tu versión:

```bash
node -v    # debe decir v24.x
npm -v     # debe decir 11.x
```

Si tienes otra versión de Node y no quieres cambiar la del sistema, usa
[nvm](https://github.com/nvm-sh/nvm) (o [nvm-windows](https://github.com/coreybutler/nvm-windows)):

```bash
nvm install 24
nvm use 24
```

**No uses pnpm ni yarn.** El repositorio tiene un `package-lock.json` de npm; mezclar
gestores produce árboles de dependencias distintos entre tu máquina y Netlify.

## Instalación

Lo primero que sorprende del repositorio: **la aplicación de Angular no está en la raíz.**
Está un nivel más abajo, en `psyconova-frontend/`. La raíz sólo contiene la configuración de
despliegue y la documentación.

```
psyconova-frontend/          ← raíz del repositorio
├── netlify.toml             ← configuración de despliegue
├── README.md
├── DEPLOY.md
├── docs/                    ← esta documentación
└── psyconova-frontend/      ← LA APLICACIÓN (aquí corres todos los comandos)
    ├── package.json
    ├── angular.json
    ├── src/
    ├── netlify/functions/
    ├── scripts/
    └── design/
```

Esa doble carpeta con el mismo nombre confunde a todo el mundo la primera vez. **Regla
simple: todo comando de npm se corre en la carpeta interna.**

```bash
git clone <url-del-repositorio>
cd psyconova-frontend/psyconova-frontend
npm install
```

La instalación tarda un par de minutos y descarga unas 900 dependencias (casi todas son de
Angular y sus herramientas de compilación).

## Levantar el sitio

```bash
npm start
```

Abre <http://localhost:4200>. El servidor recompila y refresca el navegador solo cada vez que
guardas un archivo.

Para verlo desde el celular en la misma red WiFi (muy recomendable en este proyecto, porque
buena parte del diseño es específico de móvil):

```bash
npx ng serve --host 0.0.0.0
```

y entra desde el teléfono a `http://<la-ip-de-tu-computador>:4200`.

## Los comandos que existen

| Comando | Qué hace | Cuándo lo usas |
|---|---|---|
| `npm start` | Servidor de desarrollo en el puerto 4200 | Todo el tiempo |
| `npm run build` | Compila el sitio para producción en `dist/` | Antes de dar por terminado un cambio |
| `npm run watch` | Compila en modo desarrollo y se queda vigilando | Raro; casi nunca hace falta |
| `npm test` | Corre las pruebas en modo vigilancia | Al tocar lógica |
| `npx ng test --watch=false` | Corre las pruebas una vez y termina | Antes de subir cambios |
| `npm run optimize:images` | Convierte las imágenes de `design/` a WebP en `src/assets/` | Al agregar o cambiar una imagen |

Lo que **no** existe y quizá esperas: no hay linter (`npm run lint`), no hay formateador
automático en un comando (aunque sí hay configuración de Prettier en el `package.json`), y
no hay comprobación de tipos por separado (la hace el build).

### Cómo se ve un build correcto

```
Initial chunk files   | Names   |  Raw size | Estimated transfer size
main-XXXXXXXX.js      | main    | 462.87 kB |               113.58 kB
styles-XXXXXXXX.css   | styles  |  30.62 kB |                 2.13 kB
                      | Initial total | 493.49 kB |          115.71 kB

Application bundle generation complete. [8.3 seconds]

▲ [WARNING] src/app/features/home/components/cta-section/cta-section.scss exceeded
  maximum budget. Budget 10.00 kB was not met by 378 bytes with a total of 10.38 kB.
```

**Esa advertencia es normal y sale siempre.** El archivo de estilos de la sección de
contacto pesa 10,38 kB y el límite configurado es 10 kB. No rompe el build (el límite de
error está en 16 kB), pero es una señal de que esa hoja de estilos creció demasiado. Está
recogida en las [propuestas](./PROPUESTAS.md).

### Cómo se ve una corrida de pruebas correcta

```
Test Files  7 passed (7)
     Tests  8 passed (8)
  Duration  ~26s
```

Verás también la línea `Not implemented: Window's scrollTo() method`. Es un aviso del
entorno de pruebas (jsdom no implementa `scrollTo`) provocado por el `window.scrollTo(0, 0)`
del componente raíz. No es un fallo.

## Tu primer cambio

Vamos a cambiar un texto visible, que es el caso más común y el que enseña mejor cómo está
organizado el proyecto.

**Objetivo:** cambiar el subtítulo de la portada.

1. **No busques el texto en el HTML.** Los textos visibles no están en las plantillas, están
   en los archivos de idioma. Abre
   [`src/assets/i18n/es.json`](../psyconova-frontend/src/assets/i18n/es.json) y busca:

   ```json
   "hero": {
     "titleBefore": "Una nueva",
     "titleAccent": "mirada",
     "titleAfter": "para la salud mental.",
     "subtitle": "Innovación, sensibilidad y una presencia digital más humana."
   },
   ```

2. Cambia `subtitle`. Guarda. El navegador se refresca solo y ya lo ves.

3. **Ahora haz lo mismo en inglés.** Abre `src/assets/i18n/en.json` y cambia la misma clave.
   Si no lo haces, el sitio en inglés sigue mostrando el texto viejo. Los dos archivos deben
   tener exactamente las mismas claves — hoy tienen 155 cada uno.

4. Comprueba el cambio en los dos idiomas con el selector `ES / EN` de la esquina superior
   derecha.

Con eso ya sabes la regla más importante del proyecto: **texto visible → archivo de idioma;
nunca directo en el HTML.** Las excepciones (y por qué existen) están en
[06 · Internacionalización](./06-internacionalizacion.md).

## Del código a la web

> **📊 GRÁFICO G-03 — Del código a la web: el recorrido completo**
> **Va aquí:** justo debajo de este párrafo.
> **Tipo:** diagrama de flujo horizontal, de izquierda a derecha, en una sola línea con
> ramas hacia abajo.
> **Debe mostrar:** los cinco pasos por los que pasa un cambio, desde tu editor hasta el
> visitante, con el tiempo aproximado de cada uno.
> **Cajas, en orden:**
> 1. `Tu editor` → guardas un archivo.
> 2. `npm start` → recompila y refresca el navegador. **~1 s.** (Rama hacia abajo: "sólo en
>    tu máquina, nadie más lo ve").
> 3. `git push a main` → sube al repositorio.
> 4. `Netlify` → detecta el push, corre `npm install` + `npm run build`. **~2-3 min.**
>    (Rama hacia abajo con dos cajas pequeñas: "si el build falla, el sitio anterior sigue
>    publicado" y "si pasa, se publica el nuevo").
> 5. `psyconova.com` → el visitante ve el cambio.
> **Estilo:** que quede clarísimo el salto entre el paso 2 (local, instantáneo, privado) y
> el paso 4 (remoto, lento, público). Puedes separarlos con una línea vertical punteada
> etiquetada "aquí deja de ser tuyo".

Cada `git push` a la rama `main` publica el sitio automáticamente. **No hay ambiente de
pruebas ni rama de desarrollo.** Lo que subas a `main` sale al aire en unos minutos. Trabaja
en ramas y revisa antes de fusionar; ver [11 · Convenciones](./11-calidad-pruebas-convenciones.md).

## Configuración del editor

El repositorio trae `.vscode/` con extensiones recomendadas. VS Code te las ofrecerá al
abrir el proyecto. La que de verdad importa es **Angular Language Service**: te avisa de
errores dentro de las plantillas HTML, que de otro modo sólo aparecen al compilar.

El formato de código está configurado con **Prettier** dentro del `package.json`:

```json
"prettier": {
  "printWidth": 100,
  "singleQuote": true,
  "overrides": [{ "files": "*.html", "options": { "parser": "angular" } }]
}
```

Instala la extensión de Prettier y activa "Format on Save". No hay un hook de Git que lo
imponga, así que es responsabilidad de cada quien.

## Problemas conocidos al arrancar

**`ng: command not found`** — No instales Angular CLI globalmente. Usa `npm start` o
`npx ng ...`, que usan la versión del proyecto.

**El build falla con errores raros después de cambiar de rama** — Borra la caché de
Angular:

```bash
rm -rf .angular/cache      # PowerShell: Remove-Item -Recurse -Force .angular\cache
npm start
```

**Los estilos se ven rotos o desactualizados** — Es caché del navegador. Recarga forzando
(`Ctrl+Shift+R`).

**Las fuentes se ven con Arial** — Las tipografías (Arimo y Roboto) se cargan desde Google
Fonts. Sin internet, o con un bloqueador agresivo, caen a Arial. Es el comportamiento
esperado del *fallback*, no un error.

**El mapa de la sección de contacto no aparece** — Correcto: no se carga hasta que pulsas
"Aceptar y ver el mapa". Es intencional, por privacidad. Ver
[10 · Privacidad](./10-privacidad-y-legal.md).

**El formulario de contacto da error al enviarlo desde tu máquina** — También esperado. El
formulario llama a `/.netlify/functions/contact`, que sólo existe en Netlify. Para probarlo
en local necesitas la CLI de Netlify; ver [07 · Formulario](./07-formulario-de-contacto.md#probar-en-local).

---

**Siguiente:** [03 · Arquitectura](./03-arquitectura.md) — cómo está organizado el código.

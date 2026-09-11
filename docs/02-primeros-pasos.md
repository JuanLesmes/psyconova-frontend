# 02 · Primeros pasos

Este documento te lleva de "acabo de clonar el repositorio" a "hice un cambio y lo vi en
pantalla". Si algo falla, la última sección tiene los problemas conocidos.

## Requisitos

| Herramienta | Versión | Por qué esa |
|---|---|---|
| **Node.js** | 24.x | Es la versión con la que se desarrolla, la que usa Netlify para compilar y la de la integración continua. Angular 21 también acepta 20.19+ o 22.12+, pero conviene usar la misma que producción. Además, los scripts de build importan TypeScript directamente, cosa que Node 24 hace sin configurar nada. |
| **npm** | 11.x | Viene con Node 24. El proyecto fija `"packageManager": "npm@11.6.2"`. |
| **Git** | cualquiera reciente | |
| **Un editor** | VS Code recomendado | La aplicación trae configuración de VS Code lista. |

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
despliegue, la integración continua y la documentación.

```
psyconova-frontend/          ← raíz del repositorio
├── .github/workflows/ci.yml ← lint, pruebas y build en cada push y PR
├── netlify.toml             ← configuración de despliegue y cabeceras
├── README.md
├── docs/                    ← esta documentación
└── psyconova-frontend/      ← LA APLICACIÓN (aquí corres todos los comandos)
    ├── package.json
    ├── angular.json
    ├── eslint.config.js
    ├── src/
    ├── netlify/functions/
    ├── scripts/
    └── design/              ← originales de diseño, fuera de Git
```

Esa doble carpeta con el mismo nombre confunde a todo el mundo la primera vez. **Regla
simple: todo comando de npm se corre en la carpeta interna.**

```bash
git clone <url-del-repositorio>
cd psyconova-frontend/psyconova-frontend
npm install
```

La instalación tarda un par de minutos y descarga unas 740 dependencias (casi todas son de
Angular y sus herramientas de compilación).

La carpeta `design/` está en `.gitignore`: contiene los PNG y JPEG originales de las
imágenes, que pesan unos 28 MB y viven en el disco de quien desarrolla. No hacen falta para
correr ni compilar el sitio; sólo para regenerar los WebP de `src/assets/images/`. Ver
[08 · Contenido y assets](./08-contenido-y-assets.md).

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
| `npm run build` | Compila y prerenderiza el sitio en `dist/`. Antes genera `sitemap.xml` y `robots.txt` (`prebuild`); después copia `404.html` y genera la CSP (`postbuild`) | Antes de dar por terminado un cambio |
| `npm run watch` | Compila en modo desarrollo y se queda vigilando | Raro; casi nunca hace falta |
| `npm test` | Corre las pruebas en modo vigilancia | Al tocar lógica |
| `npx ng test --watch=false` | Corre las pruebas una vez y termina | Antes de subir cambios |
| `npm run lint` | ESLint sobre TypeScript y plantillas HTML | Antes de subir cambios |
| `npm run format` | Prettier sobre `src/`, `scripts/` y la función serverless | Si el editor no formatea al guardar |
| `npm run format:check` | Lo mismo, pero sólo avisa | En revisión |
| `npm run optimize:images` | Convierte los originales de `design/` a WebP en `src/assets/images/` | Al agregar o cambiar una imagen |
| `npm run fonts:download` | Descarga las fuentes de Google y regenera `src/styles/_fonts.scss` | Sólo si cambian las tipografías |
| `npm run seo:files` | Genera `sitemap.xml` y `robots.txt` a mano (el build ya lo hace) | Para comprobar la salida |

Hay dos scripts más que no tienen comando de npm porque se corren muy de vez en cuando:
`node scripts/generate-icons.mjs` (los iconos del sitio) y `node scripts/social-image.mjs`
(la imagen que muestran WhatsApp y LinkedIn al compartir el enlace).

### Cómo se ve un build correcto

```
  sitemap.xml  3 URLs sobre https://psyconova.com
  robots.txt   sitemap declarado, /assets/cuentos/ fuera del indice

Initial chunk files   | Names   |  Raw size | Estimated transfer size
chunk-XXXXXXXX.js     | -       | 189.99 kB |                55.97 kB
main-XXXXXXXX.js      | main    |  54.05 kB |                12.19 kB
…
                      | Initial total | 421.57 kB |          118.42 kB

Prerendered 4 static routes.
Application bundle generation complete. [9.0 seconds]

▲ [WARNING] src/app/features/home/components/cta-section/cta-section.scss exceeded
  maximum budget. Budget 10.00 kB was not met by 849 bytes with a total of 10.85 kB.

  404.html     copiado a la raiz del build (lo sirve Netlify con codigo 404)
  CSP          aplicando  app: 3 scripts + 1 atributos  |  cuento: 1 scripts
```

Tres cosas que hay que ver siempre: la línea `Prerendered 4 static routes` (la portada,
las dos legales y el 404), la copia de `404.html` y la generación de la CSP. Si falta
alguna, el despliegue sale incompleto.

**La advertencia del presupuesto es normal y sale siempre.** El archivo de estilos de la
sección de contacto pesa 10,85 kB y el límite de aviso es 10 kB. No rompe el build (el
límite de error está en 16 kB), pero es una señal de que esa hoja de estilos creció
demasiado. Ver [12 · Runbook](./12-runbook.md#arreglar-el-aviso-de-presupuesto-de-cta-sectionscss).

### Cómo se ve una corrida de pruebas correcta

```
Test Files  10 passed (10)
     Tests  119 passed (119)
  Duration  ~15s
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
   tener exactamente las mismas claves: hoy tienen 147 cada uno.

4. Comprueba el cambio en los dos idiomas con el selector `ES / EN` de la esquina superior
   derecha.

Con eso ya sabes la regla más importante del proyecto: **texto visible → archivo de idioma;
nunca directo en el HTML.** Las excepciones (y por qué existen) están en
[06 · Internacionalización](./06-internacionalizacion.md).

## Del código a la web

1. Guardas un archivo en tu editor. `npm start` recompila y refresca el navegador en un
   segundo. Sólo lo ves tú.
2. Subes la rama y abres un Pull Request. GitHub Actions corre lint, pruebas y build; Netlify
   publica una vista previa con URL propia.
3. Al fusionar en `main`, Netlify detecta el push, corre `npm install` y `npm run build`, y
   publica el resultado en dos o tres minutos. Si el build falla, el sitio anterior sigue
   publicado.
4. El visitante ve el cambio en `psyconova.com`.

Cada `git push` a la rama `main` publica el sitio automáticamente. **No hay ambiente de
pruebas ni rama de desarrollo.** Lo que subas a `main` sale al aire en unos minutos. Trabaja
en ramas y revisa antes de fusionar; ver [11 · Convenciones](./11-calidad-pruebas-convenciones.md).

## Configuración del editor

La carpeta de la aplicación trae `.vscode/` con extensiones recomendadas. VS Code te las
ofrecerá al abrir el proyecto. La que de verdad importa es **Angular Language Service**: te
avisa de errores dentro de las plantillas HTML, que de otro modo sólo aparecen al compilar.

El formato de código está configurado con **Prettier** dentro del `package.json`:

```json
"prettier": {
  "printWidth": 100,
  "singleQuote": true,
  "overrides": [{ "files": "*.html", "options": { "parser": "angular" } }]
}
```

Instala la extensión de Prettier y activa "Format on Save". No hay un hook de Git que lo
imponga; `npm run format:check` es la forma de comprobarlo antes de subir.

## Problemas conocidos al arrancar

**`ng: command not found`**: no instales Angular CLI globalmente. Usa `npm start` o
`npx ng ...`, que usan la versión del proyecto.

**El build falla con errores raros después de cambiar de rama**: borra la caché de
Angular:

```bash
rm -rf .angular/cache      # PowerShell: Remove-Item -Recurse -Force .angular\cache
npm start
```

**Los estilos se ven rotos o desactualizados**: es caché del navegador. Recarga forzando
(`Ctrl+Shift+R`).

**`npm run optimize:images` dice "sin originales, se omite"**: la carpeta `design/` no
está en Git. Si no tienes los originales en tu disco, no puedes regenerar las imágenes, pero
tampoco lo necesitas para trabajar: los WebP ya están en `src/assets/images/`.

**El mapa de la sección de contacto no aparece**: correcto: no se carga hasta que pulsas
"Aceptar y ver el mapa". Es intencional, por privacidad. Ver
[10 · Privacidad](./10-privacidad-y-legal.md).

**El formulario de contacto da error al enviarlo desde tu máquina**: también esperado. El
formulario llama a `/.netlify/functions/contact`, que sólo existe en Netlify. Para probarlo
en local necesitas la CLI de Netlify; ver [07 · Formulario](./07-formulario-de-contacto.md#probar-en-local).

---

**Siguiente:** [03 · Arquitectura](./03-arquitectura.md): cómo está organizado el código.

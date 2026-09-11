# PSYCONOVA · Sitio web

[![CI](https://github.com/JuanLesmes/psyconova-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/JuanLesmes/psyconova-frontend/actions/workflows/ci.yml)

PSYCONOVA es una iniciativa colombiana de salud mental que combina psicología clínica,
realidad virtual y ciberpsicología. Este repositorio contiene su sitio web público.

**En producción:** [psyconova.com](https://psyconova.com)

![Portada de psyconova.com](./docs/img/portada.png)

> **English summary.** Public website for PSYCONOVA, a Colombian mental-health practice.
> Angular 21 with standalone components and signals, prerendered with incremental
> hydration, bilingual (es/en), self-hosted fonts, a Content Security Policy generated
> from the built HTML, a contact form backed by a Netlify function, and a map that only
> loads after explicit consent. Tests with Vitest, linting with angular-eslint, CI on
> GitHub Actions, deployed on Netlify. The app lives in `psyconova-frontend/`.

---

## Arranque rápido

La aplicación no está en la raíz del repositorio: está en `psyconova-frontend/`.
Todos los comandos de npm se corren ahí.

```bash
cd psyconova-frontend
npm install
npm start          # http://localhost:4200
```

Requiere **Node 24** y **npm 11**.

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo |
| `npm run build` | Compila para producción y prerenderiza las páginas |
| `npx ng test --watch=false` | Corre las pruebas una vez |
| `npm run lint` | ESLint sobre TypeScript y plantillas |
| `npm run format` | Prettier sobre el código fuente |
| `npm run optimize:images` | Convierte los originales de `design/` a WebP |
| `npm run fonts:download` | Regenera las fuentes autoalojadas |

## Stack

Angular 21 (componentes standalone, signals, control de flujo `@if`/`@for`, `@defer` con
hidratación incremental) · TypeScript 5.9 en modo estricto · SCSS a mano · `@ngx-translate`
(español e inglés) · Vitest · angular-eslint y Prettier · una función serverless de Netlify
que envía los correos del formulario vía Resend.

## Lo que hay debajo

- **Prerenderizado completo** con hidratación y repetición de eventos. El HTML de cada
  página sale listo para los buscadores; el JavaScript de las secciones inferiores de la
  portada se carga cuando entran en pantalla.
- **SEO desde una sola fuente.** Título, descripción, canonical, Open Graph y ficha de
  negocio (`MedicalBusiness`) salen de `site.config.ts`. De ahí también se generan
  `sitemap.xml` y `robots.txt` en cada build, y hay una prueba que impide que el router
  y esa lista se separen.
- **Cabeceras de seguridad** en `netlify.toml` y una **Content Security Policy** con hashes
  que se recalcula a partir del HTML construido en cada build.
- **404 real.** La página de error se prerenderiza y Netlify la sirve con código 404. El
  build falla si el archivo no se generó.
- **Accesibilidad:** enlace de salto, encierro del foco en el menú (con pruebas de teclado),
  `inert` en la barra oculta, consentimiento del mapa con aceptar y rechazar del mismo peso,
  y respeto a `prefers-reduced-motion`.
- **Privacidad:** fuentes autoalojadas, ninguna petición a terceros antes de que el
  visitante lo autorice, y la clave de Resend sólo en el servidor.

## Estructura

```
.
├── .github/workflows/ci.yml   Lint, pruebas y build en cada push y PR
├── netlify.toml               Configuración de despliegue y cabeceras
├── docs/                      Documentación del proyecto
└── psyconova-frontend/        La aplicación de Angular
    ├── src/app/core/          Configuración y servicios
    ├── src/app/layout/        Navbar, footer, marco del sitio
    ├── src/app/features/      Portada, páginas legales y 404
    ├── src/app/shared/        Menú, directivas y piezas reutilizables
    ├── src/assets/i18n/       Todos los textos visibles del sitio
    ├── netlify/functions/     La función que envía los correos
    ├── scripts/               Imágenes, iconos, fuentes, SEO y CSP
    └── design/                Originales de diseño (fuera de Git)
```

## Documentación

La documentación completa está en **[`docs/`](./docs/)**.

**Si eres nuevo en el proyecto**, empieza por aquí, en este orden:

1. [Visión general](./docs/01-vision-general.md) — qué es el proyecto y qué hace el sitio
2. [Primeros pasos](./docs/02-primeros-pasos.md) — instalación y tu primer cambio
3. [Arquitectura](./docs/03-arquitectura.md) — cómo está organizado el código

Y después, como consulta:

| | |
|---|---|
| [04 · Sistema de diseño](./docs/04-sistema-de-diseno.md) | Colores, tipografía, animaciones |
| [05 · Catálogo de componentes](./docs/05-catalogo-de-componentes.md) | Ficha de cada pieza |
| [06 · Internacionalización](./docs/06-internacionalizacion.md) | Los dos idiomas |
| [07 · Formulario de contacto](./docs/07-formulario-de-contacto.md) | El único flujo con servidor |
| [08 · Contenido y assets](./docs/08-contenido-y-assets.md) | Imágenes y el cuento interactivo |
| [09 · Despliegue y operación](./docs/09-despliegue-y-operacion.md) | Netlify, dominio, costos |
| [10 · Privacidad y legal](./docs/10-privacidad-y-legal.md) | Ley 1581, consentimientos |
| [11 · Calidad y convenciones](./docs/11-calidad-pruebas-convenciones.md) | Pruebas, estilo, Git |
| [12 · Runbook](./docs/12-runbook.md) | Recetas para las tareas frecuentes |

## Dos cosas que hay que saber antes de tocar nada

**Los textos visibles no están en el HTML.** Están en `src/assets/i18n/es.json` y `en.json`.
Si cambias uno, cámbialo en los dos.

**Cada push a `main` publica el sitio.** No hay ambiente de pruebas aparte. Trabaja en una
rama y revisa la vista previa que Netlify genera para cada Pull Request.

## Despliegue

Automático en Netlify a cada push a `main`. La configuración vive en
[`netlify.toml`](./netlify.toml) y contempla que la aplicación no está en la raíz.

El formulario de contacto necesita la variable de entorno `RESEND_API_KEY` configurada en
Netlify. Ver [09 · Despliegue](./docs/09-despliegue-y-operacion.md).

# PSYCONOVA · Sitio web

PSYCONOVA es una iniciativa colombiana de salud mental que combina psicología clínica,
realidad virtual y ciberpsicología. Este repositorio contiene su sitio web público.

**En producción:** [psyconova.com](https://psyconova.com)

---

## Arranque rápido

⚠️ **La aplicación no está en la raíz del repositorio**, está en `psyconova-frontend/`.
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
| `npm run build` | Compila para producción |
| `npx ng test --watch=false` | Corre las pruebas una vez |
| `npm run optimize:images` | Convierte las imágenes de `design/` a WebP |

## Stack

Angular 21 (componentes standalone) · TypeScript 5.9 · SCSS a mano · `@ngx-translate`
(español e inglés) · Vitest · una función serverless de Netlify que envía los correos del
formulario vía Resend.

## Estructura

```
.
├── netlify.toml            Configuración de despliegue
├── DEPLOY.md               Guía original de configuración de Netlify
├── docs/                   ← DOCUMENTACIÓN COMPLETA
└── psyconova-frontend/     La aplicación de Angular
    ├── src/app/core/       Servicios y configuración
    ├── src/app/layout/     Navbar, footer, marco del sitio
    ├── src/app/features/   Portada y páginas legales
    ├── src/app/shared/     Piezas reutilizables
    ├── src/assets/i18n/    Todos los textos visibles del sitio
    ├── netlify/functions/  La función que envía los correos
    ├── scripts/            Optimización de imágenes
    └── design/             Imágenes originales (no se publican)
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
| [PROPUESTAS](./docs/PROPUESTAS.md) | Recomendaciones de mejora (sin lenguaje técnico) |

## Tres cosas que hay que saber antes de tocar nada

**Los textos visibles no están en el HTML.** Están en `src/assets/i18n/es.json` y `en.json`.
Si cambias uno, cámbialo en los dos.

**El menú está duplicado.** Vive en `navbar.html` y en `hero-section.html`. Si tocas uno,
toca el otro.

**Cada push a `main` publica el sitio.** No hay ambiente de pruebas. Trabaja en una rama y
revisa la vista previa que Netlify genera para cada Pull Request.

## Despliegue

Automático en Netlify a cada push a `main`. La configuración vive en
[`netlify.toml`](./netlify.toml) y contempla que la aplicación no está en la raíz.

El formulario de contacto necesita la variable de entorno `RESEND_API_KEY` configurada en
Netlify. Ver [`DEPLOY.md`](./DEPLOY.md) y
[09 · Despliegue](./docs/09-despliegue-y-operacion.md).

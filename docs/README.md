# Documentación de PSYCONOVA

Esta carpeta contiene la documentación completa del sitio web de PSYCONOVA. Está escrita
para que alguien que nunca ha visto el proyecto pueda leerla en orden, entender qué hace
cada pieza y empezar a aportar sin tener que preguntar nada.

## Cómo leer esto

**Si eres nuevo en el proyecto**, lee en este orden: 01 → 02 → 03. Con eso ya puedes
levantar el sitio en tu máquina y ubicarte en el código. El resto son documentos de
consulta: los abres cuando toques esa parte.

**Si vas a hacer un cambio puntual** (cambiar un teléfono, agregar un servicio, subir una
foto), ve directo al [Runbook](./12-runbook.md): son recetas paso a paso.

## Índice

| # | Documento | De qué trata |
|---|---|---|
| 01 | [Visión general](./01-vision-general.md) | Qué es PSYCONOVA, qué hace el sitio, quién lo usa, glosario |
| 02 | [Primeros pasos](./02-primeros-pasos.md) | Requisitos, instalación, comandos, tu primer cambio |
| 03 | [Arquitectura](./03-arquitectura.md) | Estructura de carpetas, capas, rutas, decisiones de diseño técnico |
| 04 | [Sistema de diseño](./04-sistema-de-diseno.md) | Colores reales, tipografía, espaciado, animaciones, patrones SCSS |
| 05 | [Catálogo de componentes](./05-catalogo-de-componentes.md) | Ficha detallada de cada componente, servicio y directiva |
| 06 | [Internacionalización](./06-internacionalizacion.md) | Cómo funcionan los idiomas, cómo agregar textos |
| 07 | [Formulario de contacto](./07-formulario-de-contacto.md) | Flujo completo del formulario, función serverless, correos |
| 08 | [Contenido y assets](./08-contenido-y-assets.md) | Imágenes, optimización, logos, fuentes, el cuento interactivo |
| 09 | [Despliegue y operación](./09-despliegue-y-operacion.md) | Netlify, variables de entorno, dominio, costos, rollback |
| 10 | [Privacidad y legal](./10-privacidad-y-legal.md) | Ley 1581, consentimientos, cookies, documentos legales |
| 11 | [Calidad, pruebas y convenciones](./11-calidad-pruebas-convenciones.md) | Tests, lint, estilo de código, Git, revisión de cambios |
| 12 | [Runbook: tareas frecuentes](./12-runbook.md) | Recetas paso a paso para los cambios más comunes |

## Estado de esta documentación

Refleja el código de la rama `main` a **11 de septiembre de 2026**. Describe el sitio tal
como está, incluyendo las partes incompletas: donde algo está a medias, el documento lo
dice en vez de describir cómo debería ser.

Si cambias el comportamiento de algo documentado aquí, actualiza el documento en el mismo
commit. Una documentación que miente es peor que no tener ninguna.

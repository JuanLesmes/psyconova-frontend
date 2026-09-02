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

**Si eres la dueña del sitio o alguien del lado de negocio**, el documento que te interesa
es [PROPUESTAS.md](./PROPUESTAS.md), que está escrito sin lenguaje técnico.

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
| 08 | [Contenido y assets](./08-contenido-y-assets.md) | Imágenes, optimización, logos, el cuento interactivo |
| 09 | [Despliegue y operación](./09-despliegue-y-operacion.md) | Netlify, variables de entorno, dominio, costos, rollback |
| 10 | [Privacidad y legal](./10-privacidad-y-legal.md) | Ley 1581, consentimientos, cookies, documentos legales |
| 11 | [Calidad, pruebas y convenciones](./11-calidad-pruebas-convenciones.md) | Tests, estilo de código, Git, revisión de cambios |
| 12 | [Runbook: tareas frecuentes](./12-runbook.md) | Recetas paso a paso para los cambios más comunes |
| — | [PROPUESTAS.md](./PROPUESTAS.md) | Recomendaciones de mejora para presentar a la dueña |

## Versiones en Word

Los mismos contenidos están en [`docs/word/`](./word/) como dos documentos `.docx` con
portada, índice navegable y estilos de título:

| Documento | Páginas | Contenido |
|---|---|---|
| `PSYCONOVA - Documentacion Tecnica.docx` | 88 | Este índice y los capítulos 01 a 12 |
| `PSYCONOVA - Propuestas de Mejora.docx` | 21 | `PROPUESTAS.md`, para presentar a la dueña |

Se regeneran con `python generar-word.py` desde esa carpeta. Los detalles, en
[`docs/word/README.md`](./word/README.md).

## Índice de gráficos por hacer

La documentación está escrita para acompañarse de diagramas. Cada punto donde debe ir uno
está marcado dentro del documento con un bloque como este:

> **📊 GRÁFICO G-00 — Título del gráfico**
> **Va aquí:** dónde exactamente se inserta.
> **Tipo:** qué clase de diagrama es.
> **Debe mostrar:** el contenido concreto.
> **Etiquetas exactas:** los textos que deben aparecer.
> **Estilo:** indicaciones visuales.

Esta es la lista completa, para que puedas hacerlos todos de una sentada y luego
insertarlos. Cuando tengas la imagen, guárdala en `docs/img/` con el nombre del código
(por ejemplo `docs/img/G-01.png`) y reemplaza el bloque por `![Título](./img/G-01.png)`.

| Código | Título | Documento |
|---|---|---|
| G-01 | Mapa de la portada, sección por sección | [01](./01-vision-general.md) |
| G-02 | Los tres públicos del sitio y qué busca cada uno | [01](./01-vision-general.md) |
| G-03 | Del código a la web: el recorrido completo | [02](./02-primeros-pasos.md) |
| G-04 | Árbol de carpetas comentado | [03](./03-arquitectura.md) |
| G-05 | Las cuatro capas y quién puede llamar a quién | [03](./03-arquitectura.md) |
| G-06 | Árbol de componentes en pantalla | [03](./03-arquitectura.md) |
| G-07 | Mapa de rutas y anclas | [03](./03-arquitectura.md) |
| G-08 | Ciclo de vida de una visita | [03](./03-arquitectura.md) |
| G-09 | Paleta de color real y dónde se usa cada tono | [04](./04-sistema-de-diseno.md) |
| G-10 | Ritmo claro-oscuro de las secciones | [04](./04-sistema-de-diseno.md) |
| G-11 | Anatomía de una sección tipo | [04](./04-sistema-de-diseno.md) |
| G-12 | Cómo funciona la animación de aparición (reveal) | [04](./04-sistema-de-diseno.md) |
| G-13 | Estados del navbar según el scroll | [05](./05-catalogo-de-componentes.md) |
| G-14 | Anatomía de la constelación de la sección Intro | [05](./05-catalogo-de-componentes.md) |
| G-15 | Estados del componente de cuentos | [05](./05-catalogo-de-componentes.md) |
| G-16 | Cómo se resuelve un texto traducido | [06](./06-internacionalizacion.md) |
| G-17 | Decisión: ¿este texto va en i18n o en el código? | [06](./06-internacionalizacion.md) |
| G-18 | Recorrido de una consulta, del formulario al correo | [07](./07-formulario-de-contacto.md) |
| G-19 | Máquina de estados del formulario | [07](./07-formulario-de-contacto.md) |
| G-20 | Validaciones y códigos de respuesta de la función | [07](./07-formulario-de-contacto.md) |
| G-21 | Flujo de una imagen, del original al navegador | [08](./08-contenido-y-assets.md) |
| G-22 | Inventario visual de assets | [08](./08-contenido-y-assets.md) |
| G-23 | Arquitectura de despliegue en Netlify | [09](./09-despliegue-y-operacion.md) |
| G-24 | Línea de tiempo de un despliegue | [09](./09-despliegue-y-operacion.md) |
| G-25 | Mapa de datos personales que toca el sitio | [10](./10-privacidad-y-legal.md) |
| G-26 | Los dos consentimientos y qué bloquea cada uno | [10](./10-privacidad-y-legal.md) |
| G-27 | Flujo de trabajo con Git | [11](./11-calidad-pruebas-convenciones.md) |
| G-28 | Pirámide de pruebas: lo que hay y lo que falta | [11](./11-calidad-pruebas-convenciones.md) |
| G-29 | Matriz impacto / esfuerzo de las propuestas | [PROPUESTAS](./PROPUESTAS.md) |
| G-30 | Hoja de ruta sugerida en tres fases | [PROPUESTAS](./PROPUESTAS.md) |

## Estado de esta documentación

Escrita el **28 de agosto de 2026**, contra el commit `bf22a17`. Refleja el código tal como
está, incluyendo las partes incompletas: donde algo está a medias o mal, el documento lo
dice en vez de describir cómo debería ser.

Si cambias el comportamiento de algo documentado aquí, actualiza el documento en el mismo
commit. Una documentación que miente es peor que no tener ninguna.

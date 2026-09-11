# Versiones en Word

Los mismos documentos de [`docs/`](../), en formato `.docx`.

| Archivo | Páginas | Para quién |
|---|---|---|
| `PSYCONOVA - Documentacion Tecnica.docx` | 88 | Equipo de desarrollo. Índice + los 12 capítulos. |
| `PSYCONOVA - Propuestas de Mejora.docx` | 21 | La dueña del sitio. Las 20 propuestas priorizadas. |

Los dos traen portada, índice navegable con números de página, encabezado y pie, y estilos
de título reales (funciona el panel de navegación de Word con `Ctrl+B`).

> **Estos `.docx` son ahora la versión de referencia.** El script que los generaba desde el
> Markdown se retiró del repositorio, así que los cambios se hacen directamente en Word.
> Si editas los `.md` de [`docs/`](../), acuérdate de reflejarlo aquí a mano: ya no hay nada
> que los mantenga sincronizados.

## Los recuadros de gráfico

Los 30 gráficos por hacer aparecen como **recuadros amarillos con borde**, con la
instrucción completa dentro y esta línea al final:

> ▢ Reemplaza este recuadro por la imagen terminada.

Son fáciles de encontrar hojeando el documento. Para cada uno: guarda la imagen en
[`docs/img/`](../img/), borra el recuadro en Word e inserta la imagen en su lugar.

Ya no hay riesgo de perder ese trabajo al regenerar, porque no se regenera nada.

## Actualizar el índice

El índice es un campo de Word y no se rellena solo. Al abrir el documento:

1. `Ctrl+E` para seleccionar todo.
2. `F9`.
3. Elige "Actualizar toda la tabla".

O haz clic derecho sobre el índice → Actualizar campos.

## Exportar a PDF

Con el documento abierto en Word: **Archivo → Exportar → Crear documento PDF/XPS**. Marca
"Crear marcadores usando: Títulos" para que el PDF conserve el índice navegable.

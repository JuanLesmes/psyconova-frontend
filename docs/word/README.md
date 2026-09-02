# Versiones en Word

Los mismos documentos de [`docs/`](../), en formato `.docx`.

| Archivo | Páginas | Para quién |
|---|---|---|
| `PSYCONOVA - Documentacion Tecnica.docx` | 88 | Equipo de desarrollo. Índice + los 12 capítulos. |
| `PSYCONOVA - Propuestas de Mejora.docx` | 21 | La dueña del sitio. Las 20 propuestas priorizadas. |

Los dos traen portada, índice navegable con números de página, encabezado y pie, y estilos
de título reales (funciona el panel de navegación de Word con `Ctrl+B`).

## Los recuadros de gráfico

Los 30 gráficos por hacer aparecen como **recuadros amarillos con borde**, con la
instrucción completa dentro y esta línea al final:

> ▢ Reemplaza este recuadro por la imagen terminada.

Son fáciles de encontrar hojeando el documento. Puedes trabajar de dos maneras:

**A · Directamente en Word** — Borras el recuadro, pegas la imagen. Rápido, pero si después
se regeneran los documentos desde el Markdown, se pierde el trabajo.

**B · En el Markdown y regenerando** *(recomendado)* — Guardas la imagen en
[`docs/img/`](../img/) y en el `.md` reemplazas el bloque `> **📊 GRÁFICO G-XX …**` por:

```markdown
![Título del gráfico](./img/g-01.png)
```

Después regeneras los `.docx` (ver abajo). La imagen queda incrustada, centrada y con su
pie, y los dos formatos se mantienen sincronizados.

## Regenerar los documentos

Desde esta carpeta:

```bash
python generar-word.py
```

Requiere `python-docx`:

```bash
python -m pip install python-docx
```

El script lee los `.md` de `docs/` y reescribe los dos `.docx`. **Sobrescribe lo que haya**,
así que cualquier edición hecha a mano en Word se pierde.

### Actualizar el índice

El índice es un campo de Word y no se rellena solo al generar el archivo. Al abrirlo:

1. `Ctrl+E` para seleccionar todo.
2. `F9`.
3. Elige "Actualizar toda la tabla".

O haz clic derecho sobre el índice → Actualizar campos.

## Exportar a PDF

Con el documento abierto en Word: **Archivo → Exportar → Crear documento PDF/XPS**. Marca
"Crear marcadores usando: Títulos" para que el PDF conserve el índice navegable.

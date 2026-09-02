# Gráficos de la documentación

Aquí van las imágenes de los 30 gráficos marcados en la documentación.

## Convención

Nombra cada archivo con el código del gráfico, en minúsculas:

```
docs/img/g-01.png
docs/img/g-02.png
…
```

La lista completa de gráficos, con su título y el documento al que pertenece, está en
[`docs/README.md`](../README.md#índice-de-gráficos-por-hacer).

## Cómo insertar uno terminado

En el documento correspondiente, busca el bloque que empieza por
`> **📊 GRÁFICO G-XX — …**` y **reemplázalo entero** por:

```markdown
![Título del gráfico](./img/g-XX.png)
```

Conserva el título del gráfico como texto alternativo: es lo que ve alguien que no puede
cargar la imagen.

## Recomendaciones de formato

- **PNG** para diagramas con texto; **SVG** si la herramienta lo exporta (se ve nítido a
  cualquier tamaño y pesa menos).
- **Ancho de 1200 a 1600 px**, para que se lea bien en pantalla grande.
- **Fondo claro**, para que se vea bien en GitHub tanto en tema claro como oscuro. Si
  prefieres fondo oscuro, comprueba cómo queda en los dos temas.
- **Texto legible al 100 %**, sin depender de hacer zoom.

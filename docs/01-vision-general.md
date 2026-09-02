# 01 · Visión general

## Qué es PSYCONOVA

PSYCONOVA es una iniciativa colombiana de salud mental que combina psicología clínica,
realidad virtual y ciberpsicología. La fundadora y directora clínica es **Laura Valentina
Lesmes Castañeda**, psicóloga clínica y de la salud con maestría en ciberpsicología.

La propuesta de valor, tal como la expresa el propio sitio: experiencias inmersivas de
relajación y regulación emocional que una persona puede vivir desde su casa u oficina, sin
conocimientos previos de tecnología y sin romper su rutina.

Hay tres líneas de servicio declaradas:

1. **Bienestar personal** — ambientes de relajación para el manejo del estrés cotidiano.
2. **Uso profesional** — herramienta de evaluación e intervención para otros psicólogos.
3. **Autoconocimiento** — espacios de introspección guiada.

A eso se suma una cuarta línea que ya está implementada en el sitio y que no aparece en las
tres tarjetas: los **cuentos terapéuticos**, narraciones interactivas que la psicóloga
entrega en consulta a familias con niños.

## Qué es este repositorio

El sitio web público de PSYCONOVA. **Es un sitio de presentación y captación, no una
aplicación.** No hay usuarios, no hay login, no hay base de datos, no hay panel de
administración. Lo que hace, en concreto:

- Cuenta qué es PSYCONOVA con una portada larga y muy visual.
- Presenta las líneas de servicio y la trayectoria de la fundadora.
- Aloja un cuento interactivo protegido por una palabra clave.
- Recibe consultas por un formulario que llegan al correo de Laura.
- Publica los documentos legales exigidos por la ley colombiana de datos personales.

Todo el contenido real vive en **una sola página** (la portada). Las demás rutas son la
política de privacidad y los términos de uso.

> **📊 GRÁFICO G-01 — Mapa de la portada, sección por sección**
> **Va aquí:** justo debajo de este párrafo, antes de "Las secciones de la portada".
> **Tipo:** wireframe esquemático vertical, tipo "vista de pájaro" de la página completa
> (rectángulos apilados, no un diseño fiel).
> **Debe mostrar:** los seis bloques de la portada en orden de scroll, cada uno con su
> nombre visible, su ancla de URL y una miniatura muy simple de su composición.
> **Etiquetas exactas, de arriba a abajo:**
> 1. `Hero` — ancla `#home` — fondo claro menta → azul. Composición: logo arriba, título
>    grande centrado, flecha de scroll abajo.
> 2. `Intro` — ancla `#nosotros` — fondo claro blanco → lavanda. Composición: título arriba,
>    y debajo una "constelación": un círculo central con imagen y 7 nodos alrededor.
> 3. `Servicios` — ancla `#services` — **fondo oscuro azul noche**. Composición: título a la
>    izquierda, lista de 4 características, y 3 tarjetas en fila.
> 4. `Cuentos` — ancla `#cuentos` — **fondo oscuro azul noche**. Composición: a la izquierda
>    la portada del cuento con un candado encima, a la derecha la ficha y el campo de la
>    palabra clave.
> 5. `Equipo` — ancla `#equipo` — fondo claro lavanda → blanco. Composición: tarjeta grande
>    con la foto de Laura a la izquierda y su biografía a la derecha.
> 6. `Contacto` — ancla `#contact` — fondo claro blanco → lila. Composición: aviso de crisis
>    arriba destacado, luego formulario a la izquierda y tarjetas de contacto + mapa a la
>    derecha.
> 7. `Footer` — sin ancla — **fondo oscuro casi negro**.
> **Estilo:** marca con un color de fondo distinto (por ejemplo gris oscuro) los bloques que
> son oscuros. La alternancia claro/oscuro es una decisión de diseño deliberada y este
> gráfico es el que la explica.

## Las secciones de la portada

| Sección | Ancla | Componente | Qué hace |
|---|---|---|---|
| Portada | `#home` | `HeroSection` | Título de marca, menú propio, selector de idioma |
| Qué es PSYCONOVA | `#nosotros` | `IntroSection` | Constelación interactiva de 7 conceptos |
| Servicios | `#services` | `ServicesSection` | 4 características + 3 tarjetas de servicio |
| Cuentos | `#cuentos` | `StoriesSection` | Cuento interactivo con palabra clave |
| Equipo | `#equipo` | `TeamSection` | Perfil de la directora clínica |
| Contacto | `#contact` | `CtaSection` | Líneas de crisis, formulario, datos, mapa |

Ojo con una trampa de nombres: la sección de contacto la implementa un componente llamado
`CtaSection` (de *call to action*), no `ContactSection`. Y el menú llama "Nosotros" a lo que
en el código es `#intro`... salvo que ese ancla no existe: el enlace del menú apunta a
`#intro` pero la sección tiene `id="nosotros"`. Está documentado como defecto conocido en
[03 · Arquitectura](./03-arquitectura.md#defectos-conocidos-de-navegación).

## Quién usa el sitio

> **📊 GRÁFICO G-02 — Los tres públicos del sitio y qué busca cada uno**
> **Va aquí:** reemplazando la tabla de abajo, o justo encima de ella.
> **Tipo:** tres columnas paralelas, cada una con un icono de persona arriba.
> **Debe mostrar:** para cada público: quién es, qué viene a hacer, por qué camino del sitio
> pasa, y cuál es el "final feliz" de su visita.
> **Contenido de cada columna:**
> - **Columna 1 — Persona que busca bienestar.** Llega por redes o recomendación. Recorre
>   Hero → Intro → Servicios. Final feliz: envía el formulario o escribe por WhatsApp.
> - **Columna 2 — Psicólogo o profesional.** Busca la herramienta para su propia práctica.
>   Recorre Servicios (tarjeta "Uso profesional") → Equipo. Final feliz: contacta para una
>   demostración.
> - **Columna 3 — Familia con el cuento.** Ya está en consulta, Laura le dio la palabra
>   clave. Va directo a `#cuentos`. Final feliz: desbloquea y lee el cuento.
> **Estilo:** dibuja el recorrido como una flecha vertical que atraviesa miniaturas de las
> secciones; que se vea que cada público usa un subconjunto distinto del sitio.

| Público | Qué busca | Dónde termina |
|---|---|---|
| Persona interesada en su bienestar | Entender qué es y si le sirve | Formulario de contacto o WhatsApp |
| Psicólogo o profesional de la salud | Una herramienta para su consulta | Formulario de contacto |
| Familia en proceso terapéutico | Abrir el cuento que le dieron en consulta | Sección de cuentos |
| Persona en crisis | Ayuda inmediata | **Líneas de crisis**, no el formulario |

Ese último caso explica una decisión importante del diseño: el aviso de líneas de crisis
está **antes** del formulario en la sección de contacto, no después. Quien llega en un
momento difícil tiene que ver los números de atención inmediata antes de ponerse a escribir
un mensaje cuya respuesta no es inmediata. No muevas ese bloque.

## Estado real del proyecto

Sé honesto con lo que hay. El sitio está **publicado y funcional**, pero tiene partes a
medio terminar que conviene conocer antes de tocar nada:

**Lo que funciona completo:**
- Toda la portada, en español e inglés.
- El formulario de contacto, incluida la función serverless que manda el correo.
- El cuento interactivo con su palabra clave.
- Los dos documentos legales (aunque son borradores, ver más abajo).
- El despliegue automático en Netlify.

**Lo que está incompleto o pendiente:**

| Qué | Estado | Dónde |
|---|---|---|
| Rutas `/about`, `/services`, `/contact` | Muestran el texto `about works!` de la plantilla de Angular. Son accesibles escribiendo la URL. | `src/app/features/{about,services,contact}/` |
| Componentes `PrimaryButton` y `SectionTitle` | Creados vacíos, nadie los usa | `src/app/shared/components/` |
| Galería de entornos VR | Comentada en el HTML y en el TypeScript | `services-section.*` |
| Equipo interdisciplinario (3 personas) | Comentado; los textos siguen en los archivos de idioma con nombres de relleno | `team-section.*` |
| Documentos legales | Llevan un aviso visible de "documento en revisión", pendiente de validación por una abogada | `features/legal/` |
| Página 404 | No existe: cualquier URL desconocida redirige a la portada en silencio | `app.routes.ts` |

Nada de esto está roto por accidente: son decisiones de "lo dejo listo para cuando haya
contenido". Pero un visitante que escriba `psyconova.com/services` **sí ve una página rota**,
y eso conviene resolverlo. Está en las [propuestas](./PROPUESTAS.md).

## Glosario

Términos que vas a encontrar en el código y en el resto de la documentación.

**Ancla** — Un `id` en un elemento HTML al que se puede saltar desde el menú
(`#services`). Como todo el contenido está en una sola página, la navegación del sitio es
casi toda por anclas, no por rutas.

**Ciberpsicología** — Rama de la psicología que estudia el comportamiento humano en
entornos digitales y el uso de tecnología en intervención psicológica. Es la especialidad de
la fundadora y el marco teórico de la propuesta.

**Componente standalone** — En Angular, un componente que declara sus propias dependencias
sin necesitar un `NgModule`. **Todos** los componentes de este proyecto son standalone; aquí
no hay ni un solo módulo.

**Constelación / sinapsis** — El nombre informal de la pieza visual de la sección "Qué es
PSYCONOVA": un círculo central con una imagen y siete nodos alrededor, unidos por líneas que
se iluminan al pasar el mouse. En el código las clases se llaman `synapse-*`.

**Cuento terapéutico** — Narración interactiva diseñada para acompañar a niños en una
situación concreta. Actualmente hay uno: *Las Manadas*, sobre separación y familias que se
recomponen.

**Función serverless** — Un pedacito de código que corre en el servidor de Netlify sólo
cuando alguien lo llama. Aquí hay exactamente una: la que recibe el formulario y manda el
correo. Existe porque la clave del servicio de correo no puede estar en el navegador.

**Honeypot / campo trampa** — Un campo de formulario invisible para las personas pero que
los bots automáticos llenan. Si llega con texto, el envío se descarta. Es la única defensa
anti-spam que tiene el formulario.

**i18n** — Abreviatura de *internationalization* (i + 18 letras + n). Aquí, el sistema que
permite que el sitio esté en español e inglés.

**Reveal** — La animación de aparición al hacer scroll. Es una directiva propia,
`RevealDirective`, que se usa escribiendo `reveal` como atributo en cualquier elemento.

**Resend** — El servicio externo que efectivamente envía los correos del formulario.

**SPA** (*Single Page Application*) — Aplicación de una sola página: el navegador carga el
sitio una vez y el resto de la navegación ocurre sin recargar. Tiene una consecuencia
directa en el despliegue, explicada en [09 · Despliegue](./09-despliegue-y-operacion.md).

**Token de diseño** — Un valor de diseño con nombre (`--color-primary`) en vez de un valor
suelto (`#67CECF`). Este proyecto tiene tokens definidos pero, en la práctica, casi no los
usa; ver [04 · Sistema de diseño](./04-sistema-de-diseno.md).

## Datos de contacto y cuentas

Todo lo que el sitio publica como dato de contacto vive en **un solo archivo**:
[`core/config/contact.config.ts`](../psyconova-frontend/src/app/core/config/contact.config.ts).
Si un teléfono o un correo aparece en pantalla, viene de ahí. No lo busques en las
plantillas.

| Dato | Valor actual |
|---|---|
| WhatsApp | +57 305 373 2503 |
| Correo | laura.lesmes@psyconova.com |
| Dirección | Carrera 13 #90-20, Edificio Professional Bureau, Bogotá |
| Horario publicado | Lunes a viernes, 8:00 am – 6:00 pm |

Servicios externos de los que depende el sitio: **Netlify** (alojamiento y despliegue),
**Resend** (envío de correos), **Squarespace Domains** (el dominio psyconova.com), **Google
Fonts** y **Google Maps**. Quién es dueño de cada cuenta está en
[09 · Despliegue](./09-despliegue-y-operacion.md) y es un punto que conviene revisar.

---

**Siguiente:** [02 · Primeros pasos](./02-primeros-pasos.md) — cómo levantar el sitio en tu
máquina.

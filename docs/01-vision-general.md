# 01 · Visión general

## Qué es PSYCONOVA

PSYCONOVA es una iniciativa colombiana de salud mental que combina psicología clínica,
realidad virtual y ciberpsicología. La titular del sitio es su fundadora y directora
clínica: psicóloga clínica y de la salud con maestría en ciberpsicología.

La propuesta de valor, tal como la expresa el propio sitio: experiencias inmersivas de
relajación y regulación emocional que una persona puede vivir desde su casa u oficina, sin
conocimientos previos de tecnología y sin romper su rutina.

Hay tres líneas de servicio declaradas:

1. **Bienestar personal**: ambientes de relajación para el manejo del estrés cotidiano.
2. **Uso profesional**: herramienta de evaluación e intervención para otros psicólogos.
3. **Autoconocimiento**: espacios de introspección guiada.

A eso se suma una cuarta línea implementada en el sitio que no aparece en las tres
tarjetas: los **cuentos terapéuticos**, narraciones interactivas que se entregan en consulta
a familias con niños.

## Qué es este repositorio

El sitio web público de PSYCONOVA. **Es un sitio de presentación y captación, no una
aplicación.** No hay usuarios, no hay login, no hay base de datos, no hay panel de
administración. Lo que hace, en concreto:

- Cuenta qué es PSYCONOVA con una portada larga y muy visual.
- Presenta las líneas de servicio y la trayectoria de la fundadora.
- Aloja un cuento interactivo protegido por una palabra clave.
- Recibe consultas por un formulario que llegan al correo de contacto del negocio.
- Publica los documentos legales exigidos por la ley colombiana de datos personales.

Todo el contenido real vive en **una sola página** (la portada). Las demás rutas son la
política de privacidad, los términos de uso y la página de error 404.

## Las secciones de la portada

| Sección | Ancla | Componente | Qué hace |
|---|---|---|---|
| Portada | `#home` | `HeroSection` | Título de marca y la barra de menú sobre la portada |
| Qué es PSYCONOVA | `#nosotros` | `IntroSection` | Constelación interactiva de 7 conceptos |
| Servicios | `#services` | `ServicesSection` | 4 características + 3 tarjetas de servicio |
| Cuentos | `#cuentos` | `StoriesSection` | Cuento interactivo con palabra clave |
| Equipo | `#equipo` | `TeamSection` | Perfil de la directora clínica |
| Contacto | `#contact` | `CtaSection` | Líneas de crisis, formulario, datos, mapa |

Ojo con una trampa de nombres: la sección de contacto la implementa un componente llamado
`CtaSection` (de *call to action*), no `ContactSection`. Y la entrada del menú "Nosotros"
lleva a `#equipo`, mientras que "¿Qué es PSYCONOVA?" lleva a `#nosotros`. Las entradas del
menú están en un solo archivo, `core/config/navigation.config.ts`; ver
[03 · Arquitectura](./03-arquitectura.md#rutas-y-navegación).

## Quién usa el sitio

| Público | Qué busca | Dónde termina |
|---|---|---|
| Persona interesada en su bienestar | Entender qué es y si le sirve | Formulario de contacto o WhatsApp |
| Psicólogo o profesional de la salud | Una herramienta para su consulta | Formulario de contacto |
| Familia en proceso terapéutico | Abrir el cuento que le dieron en consulta | Sección de cuentos |
| Persona en crisis | Ayuda inmediata | **Líneas de crisis**, no el formulario |

Ese último caso explica una decisión importante del diseño: el aviso de líneas de crisis
está **antes** del formulario en la sección de contacto, no después. Quien llega en un
momento difícil tiene que ver los números de atención inmediata antes de ponerse a escribir
un mensaje cuya respuesta no es inmediata. No muevas ese bloque. La página 404 repite esos
mismos números, por el mismo motivo.

## Estado real del proyecto

El sitio está **publicado y funcional**. Lo que hay:

**Lo que funciona completo:**
- Toda la portada, en español e inglés, prerenderizada y con hidratación incremental.
- El formulario de contacto, incluida la función serverless que manda el correo.
- El cuento interactivo con su palabra clave.
- Los dos documentos legales (aunque son borradores, ver más abajo).
- La página 404 real, con las líneas de crisis.
- SEO por página (título, descripción, canonical, Open Graph, ficha de negocio),
  `sitemap.xml` y `robots.txt` generados en cada build.
- Cabeceras de seguridad y una Content Security Policy generada en cada build.
- Pruebas automáticas (119) e integración continua en GitHub Actions.
- El despliegue automático en Netlify.

**Lo que está incompleto o pendiente:**

| Qué | Estado | Dónde |
|---|---|---|
| Documentos legales | Llevan un aviso visible de "Documento en revisión", pendiente de validación jurídica | `features/legal/` |
| Tokens de diseño | `_variables.scss` declara colores que no coinciden con los que usa el sitio; ver [04](./04-sistema-de-diseno.md) | `src/styles/_variables.scss` |

## Glosario

Términos que vas a encontrar en el código y en el resto de la documentación.

**Ancla**: un `id` en un elemento HTML al que se puede saltar desde el menú
(`#services`). Como todo el contenido está en una sola página, la navegación del sitio es
casi toda por anclas, no por rutas.

**Ciberpsicología**: rama de la psicología que estudia el comportamiento humano en
entornos digitales y el uso de tecnología en intervención psicológica. Es la especialidad de
la fundadora y el marco teórico de la propuesta.

**Componente standalone**: en Angular, un componente que declara sus propias dependencias
sin necesitar un `NgModule`. **Todos** los componentes de este proyecto son standalone; aquí
no hay ni un solo módulo. Como es el valor por defecto de Angular 21, `standalone: true` no
se escribe.

**Constelación / sinapsis**: el nombre informal de la pieza visual de la sección "Qué es
PSYCONOVA": un círculo central con una imagen y siete nodos alrededor, unidos por líneas que
se iluminan al pasar el mouse. En el código las clases se llaman `synapse-*`.

**CSP (Content Security Policy)**: cabecera que le dice al navegador de dónde puede cargar
scripts, estilos, imágenes y marcos. Aquí se genera en cada build a partir del HTML
construido; ver [09 · Despliegue](./09-despliegue-y-operacion.md).

**Cuento terapéutico**: narración interactiva diseñada para acompañar a niños en una
situación concreta. Hay uno: *Las Manadas*, sobre separación y familias que se recomponen.

**Función serverless**: un pedacito de código que corre en el servidor de Netlify sólo
cuando alguien lo llama. Aquí hay exactamente una: la que recibe el formulario y manda el
correo. Existe porque la clave del servicio de correo no puede estar en el navegador.

**Hidratación**: el proceso por el que Angular "despierta" el HTML prerenderizado en el
navegador y lo vuelve interactivo sin volver a pintarlo. Con la hidratación incremental,
las secciones inferiores de la portada sólo cargan su JavaScript cuando entran en pantalla.

**Honeypot / campo trampa**: un campo de formulario invisible para las personas pero que
los bots automáticos llenan. Si llega con texto, el envío se descarta. Es la única defensa
anti-spam que tiene el formulario.

**i18n**: abreviatura de *internationalization* (i + 18 letras + n). Aquí, el sistema que
permite que el sitio esté en español e inglés.

**Prerenderizado**: el HTML de cada página se genera al compilar, no en el navegador ni en
un servidor en tiempo real. Lo que Netlify sirve son archivos estáticos completos; el
JavaScript los hidrata después.

**Reveal**: la animación de aparición al hacer scroll. Es una directiva propia,
`RevealDirective`, que se usa escribiendo `appReveal` como atributo en cualquier elemento.

**Resend**: el servicio externo que efectivamente envía los correos del formulario.

**Signal**: la primitiva reactiva de Angular. Todo el estado de los componentes de este
proyecto vive en signals (`signal()`, `computed()`), y las plantillas lo leen llamándolas:
`menuOpen()`.

**Token de diseño**: un valor de diseño con nombre (`--color-primary`) en vez de un valor
suelto (`#67CECF`). Este proyecto tiene tokens definidos pero, en la práctica, casi no los
usa; ver [04 · Sistema de diseño](./04-sistema-de-diseno.md).

## Datos de contacto y cuentas

Todo lo que el sitio publica como dato de contacto vive en **un solo archivo**:
[`core/config/contact.config.ts`](../psyconova-frontend/src/app/core/config/contact.config.ts).
Si un teléfono o un correo aparece en pantalla, viene de ahí. No lo busques en las
plantillas. El mismo archivo alimenta la ficha de negocio que leen los buscadores y el
destino por defecto de la función que envía los correos.

| Dato | Valor actual |
|---|---|
| WhatsApp | +57 305 373 2503 |
| Correo | laura.lesmes@psyconova.com |
| Dirección | Carrera 13 #90-20, Edificio Professional Bureau, Bogotá |
| Horario publicado | Lunes a viernes, 8:00 am - 6:00 pm |

Servicios externos de los que depende el sitio: **GitHub** (código e integración continua),
**Netlify** (alojamiento, despliegue y la función serverless), **Resend** (envío de
correos), **Squarespace Domains** (el dominio psyconova.com) y **Google Maps** (sólo si el
visitante acepta cargar el mapa). Las fuentes se sirven desde el propio dominio, así que no
hay ninguna petición a Google antes de que el visitante lo autorice. Quién es dueño de cada
cuenta está en [09 · Despliegue](./09-despliegue-y-operacion.md) y es un punto que conviene
revisar.

---

**Siguiente:** [02 · Primeros pasos](./02-primeros-pasos.md): cómo levantar el sitio en tu
máquina.

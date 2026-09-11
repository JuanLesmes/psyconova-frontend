# 10 · Privacidad y legal

> **Aviso:** este documento describe cómo está implementado el tratamiento de datos en el
> sitio. **No es asesoría jurídica.** Los documentos legales publicados son borradores
> pendientes de validación jurídica.

El sitio recoge datos personales y, además, opera en un ámbito sensible: la salud mental.
Eso hace que las decisiones de privacidad aquí pesen más que en un sitio corporativo
cualquiera.

## Marco normativo

| Norma | Qué exige, en lo que aplica aquí |
|---|---|
| **Ley 1581 de 2012** | Autorización previa, expresa e informada antes de tratar datos personales |
| **Decreto 1074 de 2015** | Reglamenta la anterior; deber de conservar prueba de la autorización |
| **Ley 1090 de 2006** | Código deontológico del psicólogo; reserva profesional |

El sitio está construido bajo ley colombiana y sus documentos legales lo declaran
expresamente. Si algún día atiende público europeo de forma habitual, habría que revisar el
RGPD, que es más estricto en varios puntos (base legal documentada, derecho de
portabilidad).

## Qué datos toca el sitio

**En el navegador del visitante** quedan dos valores en `localStorage`: el idioma y la
decisión sobre el mapa. No son datos personales, nunca salen del dispositivo y no hay
cookies de seguimiento.

**Datos que se recogen:** los seis campos del formulario más la marca de tiempo del
consentimiento.

**El campo delicado es `descripcion`.** Ahí el visitante escribe qué le pasa, y en un sitio
de salud mental eso puede incluir información sobre su estado emocional, su diagnóstico o su
situación familiar. Bajo la Ley 1581 eso son **datos sensibles**, con exigencias más altas.
Es la razón por la que el consentimiento aquí no es un formalismo.

**Dónde acaban:** la consulta pasa por la función serverless de Netlify (de paso, no
almacena), por Resend (procesa el envío) y llega a la bandeja de correo del negocio, **que
es el único lugar donde queda almacenada**. No hay base de datos, no hay CRM, no hay
registro en Netlify. La función procesa la consulta en memoria y no guarda nada.

Eso tiene una cara buena (menos superficie de riesgo) y una mala (**no hay copia de
seguridad**: si un correo se borra, la consulta se pierde). Cualquier propuesta de guardar
las consultas en otro sitio tiene que pasar antes por actualizar la política de privacidad.

## Los dos consentimientos

En los dos casos **el bloqueo es previo**, no un aviso posterior. El comentario de
`contact.config.ts` lo dice sin rodeos:

> *"Un aviso que aparece después de que la cookie ya se puso no cumple con nada: el bloqueo
> previo es lo único que sirve."*

### 1. Tratamiento de datos personales

Casilla obligatoria en el formulario, con enlace a la política de privacidad:

```html
<input type="checkbox" name="consentimiento" [(ngModel)]="form.consentimiento" required />
Autorizo el tratamiento de mis datos personales de acuerdo con la <a>política de privacidad</a>.
```

Se comprueba tres veces:

1. El botón está deshabilitado: `[disabled]="!form.consentimiento || isSending()"`.
2. `onSubmit()` vuelve a comprobarlo antes de hacer nada.
3. `validarConsulta()` rechaza con `400 missing_consent` si no llega la marca de tiempo.

Y se **registra**: `consentimientoEn: new Date().toISOString()` viaja con la consulta y
aparece en el correo como "Autorización de datos". Esa marca de tiempo es la prueba de que
hubo autorización, que es exactamente lo que exige el Decreto 1074.

### 2. Carga del mapa de Google

El mapa de la sección de contacto **no se carga hasta que el visitante lo autoriza**. Los
tres estados van en una sola cadena `@if`, y el `<iframe>` sólo existe en la última rama:

```html
@if (mapConsent() === null) {
  <!-- la pregunta: aceptar, rechazar, o abrirlo en otra pestaña -->
} @else if (mapConsent() === false) {
  <!-- rechazado: la dirección, el enlace a Google Maps y "cambiar de opinión" -->
} @else {
  <iframe [src]="mapEmbedUrl" loading="lazy" referrerpolicy="no-referrer" …></iframe>
}
```

Esto es lo importante y conviene entender por qué: **si el iframe estuviera en el DOM y sólo
lo ocultara el CSS, el navegador ya habría pedido los recursos a google.com y Google ya
habría instalado sus cookies.** Al estar detrás del `@if`, el elemento no existe y ninguna
petición sale.

Mientras no se decide, se muestra una tarjeta explicando qué pasa al cargarlo ("Google
recibe tu dirección IP e instala cookies en tu navegador") con **dos botones del mismo
tamaño, la misma tipografía y el mismo peso**: aceptar y rechazar. Poner el rechazo como un
enlace gris pequeño al lado de un botón grande es lo que las autoridades consideran
consentimiento no válido: si rechazar cuesta más que aceptar, la decisión no es libre. Hay
además un enlace normal para abrir el mapa en otra pestaña, que sólo carga si se pulsa.

Quien rechaza **no vuelve a ser preguntado**: insistir después de un "no" convierte la
decisión en un trámite que hay que repetir hasta ceder. Ve la dirección, el enlace a Google
Maps y un botón para cambiar de opinión (`resetMapConsent()`), que borra lo guardado y
vuelve a mostrar la pregunta.

La decisión se guarda en `localStorage` bajo `psyconova.mapConsent.v1` (`'1'` aceptado,
`'0'` rechazado). Cualquier otro valor se trata como "sin decidir", nunca como aceptado. **El
sufijo `.v1` es deliberado:** si el texto del aviso cambia de forma sustancial, hay que subir
a `.v2` para volver a pedir permiso a quienes lo dieron sobre un texto distinto. Las
funciones que leen, guardan y olvidan la decisión están en `core/config/map-consent.ts`, y
`consent.spec.ts` y `cta-section.spec.ts` prueban los tres estados.

## Almacenamiento en el navegador

| Clave | Valor | ¿Es dato personal? |
|---|---|---|
| `psyconova.language` | `ES` o `EN` | No |
| `psyconova.mapConsent.v1` | `'1'` o `'0'` | No |

**No hay cookies de seguimiento, ni analítica, ni píxeles de redes sociales.** Ninguna
herramienta de terceros observa al visitante.

Eso hace que el sitio no necesite banner de cookies, lo cual es una ventaja real de
experiencia de usuario. **Si algún día se añade analítica, esto cambia**: habría que
actualizar la política, probablemente añadir un aviso, y autorizar el dominio en la CSP.
Una herramienta sin cookies evitaría el aviso.

## Terceros que reciben datos

| Tercero | Qué recibe | Cuándo |
|---|---|---|
| **Netlify** | La consulta completa, de paso; y la IP del visitante, como cualquier alojamiento | Al enviar el formulario; en cada visita |
| **Resend** | La consulta completa, para enviarla por correo | Al enviar el formulario |
| **Google Maps** | La IP del visitante + cookies | Sólo tras aceptar |

No hay nadie más. Las fuentes se sirven desde el propio dominio, así que ninguna petición
sale a Google antes de que el visitante lo autorice; `Referrer-Policy` limita lo que se
envía al salir del sitio a sólo el dominio, y la CSP (`connect-src 'self'`) impide que un
script inyectado mande datos a otra parte. Ver
[09 · Despliegue](./09-despliegue-y-operacion.md#la-content-security-policy).

## Los documentos legales

### Política de tratamiento de datos personales

📁 `features/legal/pages/privacy-policy/` · ruta `/politica-de-privacidad` · 197 líneas

Once secciones: responsable, qué datos se recogen, para qué, quién más interviene, cuánto se
conservan, cookies y almacenamiento local, derechos del titular, cómo ejercerlos, seguridad,
**"este sitio no atiende urgencias"** y cambios en la política.

Es un documento bien estructurado y específico de este sitio: describe los datos reales que
se recogen y los terceros reales que intervienen. No es una plantilla genérica.

### Términos de uso

📁 `features/legal/pages/terms-of-use/` · ruta `/terminos-de-uso` · 144 líneas

Doce secciones, entre ellas la más importante para el negocio:

> **"Este sitio no presta atención psicológica ni psiquiátrica en línea."** La información
> tiene fines informativos y de acompañamiento, y **no sustituye** una consulta profesional,
> un diagnóstico ni un tratamiento. Las experiencias de realidad virtual son una herramienta
> de apoyo, no una terapia por sí mismas.

Esa delimitación protege a PSYCONOVA y, sobre todo, es honesta con quien llega buscando
ayuda.

### ⚠️ Los dos son borradores

Ambos llevan un aviso visible en la parte superior (el bloque `.legal__draft`):

> **Documento en revisión.** Este texto es un borrador pendiente de validación jurídica. No
> debe considerarse definitivo hasta que se retire este aviso.

Y en el HTML, un comentario junto al bloque indica quitarlo cuando el texto quede validado.

**Mantener el aviso mientras el documento no esté validado es lo correcto**: es más honesto
que publicar un texto sin revisar como si fuera definitivo. Pero también es una tarea
pendiente con fecha: un sitio de salud mental que recoge datos sensibles con una política de
privacidad sin validar tiene una exposición real. Es el punto de mayor riesgo del proyecto.

La fecha de "Última actualización" de los dos es el **27 de agosto de 2026**. Cuando se
validen, hay que actualizarla y **quitar el bloque del aviso en los dos archivos**.

## El aviso de crisis

No es una exigencia legal, pero es la decisión más importante del sitio desde el punto de
vista del cuidado de las personas.

En la sección de contacto, **antes del formulario**, hay un bloque destacado con las líneas
de atención inmediata:

| Línea | Qué es |
|---|---|
| **106** | Atención psicológica · 24 horas, todos los días (también por WhatsApp: 300 754 8933) |
| **192** | Línea nacional de salud mental · opción 4 |
| **123** | Emergencias · 24 horas |

Con el texto: *"Este formulario no atiende urgencias. Responderemos tu consulta lo antes
posible […] pero si estás pasando por una crisis, estas líneas te atienden de inmediato."*

La página 404 repite los tres números: alguien puede llegar a ella desde un enlace roto en
un momento malo, y esa pantalla no puede ser un callejón sin salida.

Dos cosas que **no** hay que cambiar sin pensarlo mucho:

**1. La posición.** Va antes del formulario. El comentario del código lo explica: *"quien
llega en un momento difícil tiene que ver esto antes de ponerse a escribir y esperar una
respuesta que no es inmediata"*.

**2. Los números.** Están verificados contra minsalud.gov.co y saludcapital.gov.co en agosto
de 2026, y el comentario de `contact.config.ts` advierte: *"Antes de cambiar cualquiera de
estos datos, confírmalo con la fuente oficial: un número equivocado en una línea de crisis
es peor que no tener ninguna."*

Conviene **reverificar estos números una vez al año** y anotar la fecha en el comentario.
Al cambiarlos, hay que cambiarlos también en `not-found.html`, donde van escritos en el
texto.

## Seguridad

Lo que el sitio hace bien:

- **La clave de Resend nunca llega al navegador.** Vive sólo en las variables de entorno de
  Netlify. Es toda la razón de existir de la función serverless.
- **El contenido del visitante se escapa antes de meterlo en el correo HTML**, con
  `escaparHtml()`. Sin eso, alguien podría inyectar etiquetas en el correo que recibe el
  negocio.
- **Los usos de `bypassSecurityTrustResourceUrl` son seguros**: sólo se aplican a URLs
  construidas por el propio código (el archivo del cuento y la dirección del mapa), nunca a
  algo que venga del usuario.
- **Los `[innerHTML]` reciben texto de los archivos de traducción**, que escribimos nosotros,
  y Angular los sanea de todos modos.
- **Netlify sirve todo por HTTPS**, y `Strict-Transport-Security` lo hace obligatorio
  durante un año.
- **Hay cabeceras de seguridad** en `netlify.toml`: `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` y
  `Cross-Origin-Opener-Policy`.
- **Hay una Content Security Policy** con hashes, generada en cada build, que sólo permite
  scripts, estilos, conexiones y destinos de formulario del propio dominio, y marcos de
  Google Maps.
- **Los enlaces externos llevan `rel="noopener"`.**
- **El cuento queda fuera del índice de los buscadores** (`robots.txt`), para que no llegue
  a un niño por una búsqueda, fuera de contexto.

Lo que falta o es débil:

- **No hay límite de envíos en la función.** Un bot que sortee el campo trampa puede llamarla
  sin freno y agotar la cuota de Resend.
- **La palabra clave del cuento no es control de acceso**, como advierte el propio código.
- **`style-src 'unsafe-inline'`** es una concesión inevitable de la CSP: Angular inyecta los
  estilos de cada componente en tiempo de ejecución. Es la más benigna: un estilo inyectado
  puede afear la página, no ejecutar código.

## Lista de comprobación de privacidad

Antes de publicar un cambio que toque datos personales:

```
[ ] ¿Se recoge algún dato nuevo? → actualizar la sección 2 de la política de privacidad
[ ] ¿Interviene un tercero nuevo? → actualizar la sección 4, y autorizarlo en la CSP
[ ] ¿Se guarda algo nuevo en localStorage? → actualizar la sección 6
[ ] ¿Se carga algún recurso externo? → ¿necesita consentimiento previo, como el mapa?
[ ] ¿Se añadió un campo al formulario? → ¿pasa por escaparHtml() en contact-rules.ts?
[ ] ¿Cambió el texto del consentimiento del mapa? → subir la versión de MAP_CONSENT_KEY
[ ] ¿Se tocaron las líneas de crisis? → verificar contra la fuente oficial, y cambiarlas también en not-found.html
```

---

**Siguiente:** [11 · Calidad, pruebas y convenciones](./11-calidad-pruebas-convenciones.md).

# 10 · Privacidad y legal

> **Aviso:** este documento describe cómo está implementado el tratamiento de datos en el
> sitio. **No es asesoría jurídica.** Los documentos legales publicados son borradores
> pendientes de validación por una abogada.

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
RGPD, que es más estricto en varios puntos (fuentes alojadas localmente, base legal
documentada, derecho de portabilidad).

## Qué datos toca el sitio

> **📊 GRÁFICO G-25 — Mapa de datos personales que toca el sitio**
> **Va aquí:** justo debajo de este párrafo.
> **Tipo:** diagrama de flujo de datos, con tres zonas de arriba a abajo.
> **Debe mostrar:** qué dato se recoge, dónde va y quién lo ve.
> **Zonas:**
> - **Zona 1 — En el navegador del visitante.** Dos cajas pequeñas:
>   `localStorage: psyconova.language` (valor `ES`/`EN`) y
>   `localStorage: psyconova.mapConsent.v1` (valor `'1'`). Etiqueta: "No son datos
>   personales. Nunca salen del dispositivo. No hay cookies de seguimiento."
> - **Zona 2 — Lo que el visitante envía.** Una caja con los seis campos del formulario:
>   nombre, apellido, celular, correo, descripción de la consulta, y la marca de tiempo del
>   consentimiento. Etiqueta en rojo sobre `descripción`: "**puede contener datos sensibles
>   de salud** — el visitante escribe lo que le pasa".
> - **Zona 3 — A dónde va.** Flechas desde la zona 2 hacia:
>   `Función serverless de Netlify` (de paso, no almacena) → `Resend` (procesa el envío) →
>   `Bandeja de correo de Laura` (**aquí se queda, es el único almacenamiento**).
> - **Aparte, a un lado:** `Google` (Fonts siempre, Maps sólo tras consentimiento) con la
>   nota: "recibe la IP del visitante; no recibe ningún dato del formulario".
> **Anota en grande:** "No hay base de datos. La bandeja de correo de Laura es el único
> lugar donde las consultas quedan almacenadas."

**Datos que se recogen:** los seis campos del formulario más la marca de tiempo del
consentimiento.

**El campo delicado es `descripcion`.** Ahí el visitante escribe qué le pasa, y en un sitio
de salud mental eso puede incluir información sobre su estado emocional, su diagnóstico o su
situación familiar. Bajo la Ley 1581 eso son **datos sensibles**, con exigencias más altas.
Es la razón por la que el consentimiento aquí no es un formalismo.

**Dónde acaban:** en el correo de Laura, y en ningún otro sitio. No hay base de datos, no
hay CRM, no hay registro en Netlify. La función serverless procesa la consulta en memoria y
no guarda nada.

Eso tiene una cara buena (menos superficie de riesgo) y una mala (**no hay copia de
seguridad**: si un correo se borra, la consulta se pierde). Cualquier propuesta de guardar
las consultas en otro sitio tiene que pasar antes por actualizar la política de privacidad.

## Los dos consentimientos

> **📊 GRÁFICO G-26 — Los dos consentimientos y qué bloquea cada uno**
> **Va aquí:** debajo de este párrafo.
> **Tipo:** dos bloques en paralelo, cada uno con un "antes" y un "después".
> **Debe mostrar:** que en los dos casos **el bloqueo es previo**, no un aviso posterior.
> **Bloque izquierdo — Consentimiento de datos (formulario):**
> - Antes: casilla sin marcar → **el botón de enviar está deshabilitado**. Nada se envía.
> - Después: botón activo. Al enviar se añade `consentimientoEn` con la fecha y hora exactas.
> - Nota: "triple comprobación: el botón, `onSubmit()` y la función serverless".
> **Bloque derecho — Consentimiento del mapa (Google Maps):**
> - Antes: **el `<iframe>` no existe en el DOM**. Dibuja el HTML con `*ngIf="mapConsent"` y
>   una caja tachada donde iría el iframe. **Ninguna petición sale a google.com.**
> - Después: el iframe se añade y el mapa carga.
> - Nota: "se recuerda en `localStorage` bajo `psyconova.mapConsent.v1`".
> **Añade el mensaje central, en grande:** "Un aviso que aparece después de que la cookie ya
> se puso no cumple con nada. El bloqueo previo es lo único que sirve." (Es literalmente el
> comentario del código.)

### 1. Tratamiento de datos personales

Casilla obligatoria en el formulario, con enlace a la política de privacidad:

```html
<input type="checkbox" name="consentimiento" [(ngModel)]="form.consentimiento" required />
Autorizo el tratamiento de mis datos personales de acuerdo con la <a>política de privacidad</a>.
```

Se comprueba tres veces:

1. El botón está deshabilitado: `[disabled]="!form.consentimiento || isSending"`.
2. `onSubmit()` vuelve a comprobarlo antes de hacer nada.
3. La función serverless rechaza con `400 missing_consent` si no llega la marca de tiempo.

Y se **registra**: `consentimientoEn: new Date().toISOString()` viaja con la consulta y
aparece en el correo que recibe Laura como "Autorización de datos". Esa marca de tiempo es la
prueba de que hubo autorización, que es exactamente lo que exige el Decreto 1074.

### 2. Carga del mapa de Google

El mapa de la sección de contacto **no se carga hasta que el visitante lo autoriza**. El
`<iframe>` está detrás de un `*ngIf`:

```html
<iframe *ngIf="mapConsent" [src]="mapEmbedUrl" …></iframe>
```

Esto es lo importante y conviene entender por qué: **si el iframe estuviera en el DOM y sólo
lo ocultara el CSS, el navegador ya habría pedido los recursos a google.com y Google ya
habría instalado sus cookies.** Al estar detrás de `*ngIf`, el elemento no existe y ninguna
petición sale.

El comentario del código lo dice sin rodeos:

> *"Un aviso que aparece después de que la cookie ya se puso no cumple con nada: el bloqueo
> previo es lo único que sirve."*

Mientras no se acepta, se muestra una tarjeta explicando qué pasa al cargarlo ("Google recibe
tu dirección IP e instala cookies en tu navegador") con dos opciones: aceptar, o abrir el
mapa en otra pestaña. La segunda opción es un enlace normal: sólo carga si se pulsa.

La decisión se guarda en `localStorage` bajo `psyconova.mapConsent.v1`. **El sufijo `.v1` es
deliberado:** si el texto del aviso cambia de forma sustancial, hay que subir a `.v2` para
volver a pedir permiso a quienes lo dieron sobre un texto distinto.

## Almacenamiento en el navegador

| Clave | Valor | ¿Es dato personal? |
|---|---|---|
| `psyconova.language` | `ES` o `EN` | No |
| `psyconova.mapConsent.v1` | `'1'` | No |

**No hay cookies de seguimiento, ni analítica, ni píxeles de redes sociales.** Ninguna
herramienta de terceros observa al visitante.

Eso hace que el sitio no necesite banner de cookies, lo cual es una ventaja real de
experiencia de usuario. **Si algún día se añade analítica, esto cambia**: habría que
actualizar la política, y probablemente añadir un aviso. La propuesta P-04 lo tiene en
cuenta y recomienda una herramienta que no usa cookies precisamente por esto.

## Terceros que reciben datos

| Tercero | Qué recibe | Cuándo |
|---|---|---|
| **Netlify** | La consulta completa, de paso | Al enviar el formulario |
| **Resend** | La consulta completa, para enviarla por correo | Al enviar el formulario |
| **Google Fonts** | La IP del visitante | **Siempre**, en cada carga |
| **Google Maps** | La IP del visitante + cookies | Sólo tras aceptar |

Fíjate en la asimetría: el mapa está protegido tras un consentimiento explícito, pero **las
fuentes de Google se cargan siempre y sin aviso**, y también transmiten la IP a un servidor
de Google. Es una inconsistencia del enfoque actual. Alojar las fuentes en el propio sitio
la resuelve del todo y además mejora el rendimiento (P-09).

## Los documentos legales

### Política de tratamiento de datos personales

📁 `features/legal/pages/privacy-policy/` · ruta `/politica-de-privacidad` · 205 líneas

Once secciones: responsable, qué datos se recogen, para qué, quién más interviene, cuánto se
conservan, cookies y almacenamiento local, derechos del titular, cómo ejercerlos, seguridad,
**"este sitio no atiende urgencias"** y cambios en la política.

Es un documento bien estructurado y específico de este sitio: describe los datos reales que
se recogen y los terceros reales que intervienen. No es una plantilla genérica.

### Términos de uso

📁 `features/legal/pages/terms-of-use/` · ruta `/terminos-de-uso` · 148 líneas

Doce secciones, entre ellas la más importante para el negocio:

> **"Este sitio no presta atención psicológica ni psiquiátrica en línea."** La información
> tiene fines informativos y de acompañamiento, y **no sustituye** una consulta profesional,
> un diagnóstico ni un tratamiento. Las experiencias de realidad virtual son una herramienta
> de apoyo, no una terapia por sí mismas.

Esa delimitación protege a PSYCONOVA y, sobre todo, es honesta con quien llega buscando
ayuda.

### ⚠️ Los dos son borradores

Ambos llevan un aviso visible en la parte superior:

> **Documento en revisión.** Este texto es un borrador pendiente de validación jurídica. No
> debe considerarse definitivo hasta que se retire este aviso.

Y en el HTML, un comentario con la instrucción:

```html
<!-- AVISO DE BORRADOR — quitar este bloque cuando la abogada valide el texto. -->
```

**Mantener el aviso mientras el documento no esté validado es lo correcto**: es más honesto
que publicar un texto sin revisar como si fuera definitivo. Pero también es una tarea
pendiente con fecha: un sitio de salud mental que recoge datos sensibles con una política de
privacidad sin validar tiene una exposición real. Es la propuesta **P-06**, y es la de mayor
riesgo del proyecto.

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

Dos cosas que **no** hay que cambiar sin pensarlo mucho:

**1. La posición.** Va antes del formulario. El comentario del código lo explica: *"quien
llega en un momento difícil tiene que ver esto antes de ponerse a escribir y esperar una
respuesta que no es inmediata"*.

**2. Los números.** Están verificados contra minsalud.gov.co y saludcapital.gov.co en agosto
de 2026, y el comentario de `contact.config.ts` advierte: *"Antes de cambiar cualquiera de
estos datos, confírmalo con la fuente oficial: un número equivocado en una línea de crisis
es peor que no tener ninguna."*

Conviene **reverificar estos números una vez al año** y anotar la fecha en el comentario.

## Seguridad

Lo que el sitio hace bien:

- **La clave de Resend nunca llega al navegador.** Vive sólo en las variables de entorno de
  Netlify. Es toda la razón de existir de la función serverless.
- **El contenido del visitante se escapa antes de meterlo en el correo HTML**, con la función
  `escapar()`. Sin eso, alguien podría inyectar etiquetas en el correo que recibe Laura.
- **Los usos de `bypassSecurityTrustResourceUrl` son seguros**: sólo se aplican a URLs
  construidas por el propio código (el archivo del cuento y la dirección del mapa), nunca a
  algo que venga del usuario.
- **Los `[innerHTML]` reciben texto de los archivos de traducción**, que escribimos nosotros,
  y Angular los sanea de todos modos.
- **Netlify sirve todo por HTTPS** de forma automática.
- **Los enlaces externos llevan `rel="noopener"`.**

Lo que falta o es débil:

- **No hay cabeceras de seguridad.** Ni `Content-Security-Policy`, ni `X-Frame-Options`, ni
  `Referrer-Policy`. Se configuran en `netlify.toml` con un bloque `[[headers]]`; es un
  cambio de unas pocas líneas.
- **No hay límite de envíos en la función.** Un bot que sortee el campo trampa puede llamarla
  sin freno y agotar la cuota de Resend.
- **La palabra clave del cuento no es control de acceso**, como advierte el propio código.

## Lista de comprobación de privacidad

Antes de publicar un cambio que toque datos personales:

```
[ ] ¿Se recoge algún dato nuevo? → actualizar la sección 2 de la política de privacidad
[ ] ¿Interviene un tercero nuevo? → actualizar la sección 4
[ ] ¿Se guarda algo nuevo en localStorage? → actualizar la sección 6
[ ] ¿Se carga algún recurso externo? → ¿necesita consentimiento previo, como el mapa?
[ ] ¿Se añadió un campo al formulario? → ¿pasa por escapar() en la función serverless?
[ ] ¿Cambió el texto del consentimiento del mapa? → subir la versión de MAP_CONSENT_KEY
[ ] ¿Se tocaron las líneas de crisis? → verificar contra la fuente oficial
```

---

**Siguiente:** [11 · Calidad, pruebas y convenciones](./11-calidad-pruebas-convenciones.md).

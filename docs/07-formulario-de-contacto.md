# 07 · Formulario de contacto

Es la única funcionalidad del sitio que involucra un servidor, y la única por la que entra
negocio. Este documento cubre el recorrido completo: del navegador al correo de Laura.

## El recorrido completo

> **📊 GRÁFICO G-18 — Recorrido de una consulta, del formulario al correo**
> **Va aquí:** justo debajo de este párrafo. **Es el gráfico más importante de la
> documentación**; si sólo haces uno, haz este.
> **Tipo:** diagrama de secuencia, con cuatro columnas verticales (actores) y el tiempo
> corriendo hacia abajo.
> **Columnas:** `Visitante (navegador)` · `CtaSection + ContactService` ·
> `Función serverless (Netlify)` · `Resend` · `Bandeja de Laura`.
> **Mensajes, en orden:**
> 1. Visitante llena el formulario y marca el consentimiento.
> 2. Pulsa "Generar consulta" → `onSubmit()`.
> 3. `CtaSection` → `ContactService.send()` con los 7 campos, añadiendo
>    `consentimientoEn: new Date().toISOString()`.
> 4. `POST /.netlify/functions/contact` (JSON).
> 5. La función valida (ver G-20). Si todo está bien:
> 6. `POST https://api.resend.com/emails` con la cabecera `authorization: Bearer <clave>`.
> 7. Resend responde `200`.
> 8. La función responde `{ ok: true }` con estado `200`.
> 9. El componente pasa a estado `success` y muestra el mensaje de confirmación.
> 10. En paralelo, Resend entrega el correo a Laura, con `reply_to` = el correo del visitante.
> **Marca en un recuadro destacado, junto a la columna de la función serverless:**
> "**Aquí y sólo aquí** vive `RESEND_API_KEY`. Nunca llega al navegador. Ese es todo el
> motivo por el que esta función existe."
> **Dibuja también, en rojo y punteado, los dos caminos de fallo:** la función responde un
> código 4xx/5xx → el componente pasa a estado `error` → el visitante ve el mensaje con el
> correo de Laura como alternativa. **Nunca se muestra confirmación si el envío falló.**

## Las cuatro piezas

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Componente | [`cta-section.ts/.html`](../psyconova-frontend/src/app/features/home/components/cta-section/) | Formulario, validación básica, estados visibles |
| Servicio | [`contact.service.ts`](../psyconova-frontend/src/app/core/services/contact.service.ts) | Hacer el `POST`. No sabe a dónde |
| Configuración | [`contact.config.ts`](../psyconova-frontend/src/app/core/config/contact.config.ts) | La URL de destino y los datos públicos |
| Función serverless | [`netlify/functions/contact.mts`](../psyconova-frontend/netlify/functions/contact.mts) | Validar, filtrar bots y enviar por Resend |

Esa separación existe para que cambiar de proveedor de correo no toque el componente: se
cambia `CONTACT_ENDPOINT` y ya.

## Lo que se envía

```ts
interface ContactRequest {
  nombre: string;
  apellido: string;
  celular: string;
  correo: string;
  descripcion: string;
  consentimientoEn: string;  // ISO 8601, momento de la autorización
  website: string;           // campo trampa, siempre vacío en envíos humanos
}
```

`consentimientoEn` se genera en el momento del envío con `new Date().toISOString()`. **No es
decorativo: es la prueba de que hubo autorización**, que exige la Ley 1581 de 2012, y viaja
en el correo que recibe Laura. Ver [10 · Privacidad y legal](./10-privacidad-y-legal.md).

## Estados del formulario

> **📊 GRÁFICO G-19 — Máquina de estados del formulario**
> **Va aquí:** debajo de este párrafo, sustituyendo la tabla.
> **Tipo:** diagrama de estados con cuatro círculos y flechas etiquetadas.
> **Estados y qué ve el visitante en cada uno:**
> - `idle` → el formulario, editable. Botón activo sólo si el consentimiento está marcado.
> - `sending` → botón deshabilitado, texto "Enviando…".
> - `success` → **el formulario desaparece** y se muestra el mensaje de confirmación con un
>   icono de verificación. Los campos se vacían.
> - `error` → el formulario **sigue ahí con los datos escritos**, y encima del botón aparece
>   el mensaje de error con el correo de Laura como enlace.
> **Transiciones:** `idle → sending` (pulsar enviar) · `sending → success` (respuesta OK) ·
> `sending → error` (cualquier fallo) · `error → sending` (reintentar).
> **Anota junto a `error`:** "Los datos NO se pierden. La persona puede reintentar o copiar
> su mensaje al correo."
> **Anota junto a `success`:** "Es el único estado que borra el formulario, y sólo se
> alcanza si el servidor confirmó el envío."

```ts
type SubmitState = 'idle' | 'sending' | 'success' | 'error';
```

| Estado | Qué ve el visitante | Getter en la plantilla |
|---|---|---|
| `idle` | Formulario editable | — |
| `sending` | Botón deshabilitado, "Enviando…" | `isSending` |
| `success` | Confirmación; el formulario desaparece | `submitted` |
| `error` | Mensaje de error + correo alternativo; los datos siguen ahí | `hasError` |

## Defensas del formulario

**1. Consentimiento obligatorio.** Doble comprobación: el botón está deshabilitado
(`[disabled]="!form.consentimiento || isSending"`) y `onSubmit()` vuelve a comprobarlo antes
de hacer nada. La función serverless lo comprueba una tercera vez.

**2. Campo trampa (honeypot).** Un campo llamado `website`, oculto por CSS, con
`tabindex="-1"` y `autocomplete="off"`. Una persona nunca lo llena; un bot que rellena todos
los campos del formulario, sí.

```ts
if (texto(datos.website, 200) !== '') {
  return json({ ok: true }, 200);
}
```

Fíjate en que **responde 200, como si hubiera funcionado**. Es deliberado: si devolviera un
error, el bot sabría que fue detectado y volvería a intentarlo de otra forma.

**3. Validación del navegador.** Los campos llevan `required` y el correo `type="email"`.
Es una red muy fina — se salta con las herramientas de desarrollo — por eso la validación
real está en el servidor.

**4. Límite de tamaño.** La función rechaza cuerpos de más de 20 000 bytes.

**Lo que NO hay:** captcha, límite de envíos por IP (*rate limiting*), ni verificación del
correo. Si aparece spam real, el siguiente paso está anotado en `DEPLOY.md`: un captcha.

## La función serverless

📁 [`netlify/functions/contact.mts`](../psyconova-frontend/netlify/functions/contact.mts)

Recibe la consulta y la reenvía por correo usando Resend.

**Por qué existe:** la clave de API de Resend no puede estar en el navegador. Cualquiera
podría leerla y usarla para enviar correos en nombre de PSYCONOVA. La clave vive en las
variables de entorno de Netlify y sólo esta función la ve.

### Validaciones y respuestas

> **📊 GRÁFICO G-20 — Validaciones y códigos de respuesta de la función**
> **Va aquí:** debajo de este párrafo, sustituyendo la tabla.
> **Tipo:** diagrama de flujo vertical con salidas laterales.
> **Debe mostrar:** la cadena de comprobaciones en el orden exacto en que ocurren, con la
> respuesta que sale por cada rama de fallo.
> **Cadena, de arriba a abajo, con la salida a la derecha de cada una:**
> 1. ¿Es POST? → no → `405 method_not_allowed`
> 2. ¿Cuerpo ≤ 20 000 bytes? → no → `413 payload_too_large`
> 3. ¿Es JSON válido? → no → `400 invalid_json`
> 4. ¿El campo trampa viene vacío? → no → **`200 ok` sin enviar nada** (dibújalo distinto:
>    es un éxito falso, deliberado)
> 5. ¿Están los 5 campos obligatorios? → no → `400 missing_fields` (con la lista)
> 6. ¿El correo tiene forma de correo? → no → `400 invalid_email`
> 7. ¿Hay marca de consentimiento? → no → `400 missing_consent`
> 8. ¿Existe `RESEND_API_KEY`? → no → `500 not_configured`
> 9. Llamar a Resend → falla → `502 send_failed`
> 10. Todo bien → `200 { ok: true }`
> **Anota junto al paso 4** el texto: "responde 200 a propósito, para que el bot no sepa que
> fue detectado".
> **Anota junto al paso 8** el texto: "es el fallo más probable en producción: clave
> ausente, caducada o revocada".

| Comprobación | Respuesta si falla |
|---|---|
| Método `POST` | `405 method_not_allowed` |
| Cuerpo ≤ 20 000 bytes | `413 payload_too_large` |
| JSON válido | `400 invalid_json` |
| Campo trampa vacío | `200 { ok: true }` — sin enviar nada |
| 5 campos obligatorios presentes | `400 missing_fields` + lista |
| Correo con forma válida | `400 invalid_email` |
| Marca de consentimiento presente | `400 missing_consent` |
| `RESEND_API_KEY` configurada | `500 not_configured` |
| Resend acepta el envío | `502 send_failed` |
| Todo bien | `200 { ok: true }` |

Cada campo se recorta a un largo máximo antes de usarse:

```ts
const texto = (valor: unknown, maximo: number): string =>
  typeof valor === 'string' ? valor.trim().slice(0, maximo) : '';
```

| Campo | Máximo |
|---|---|
| `nombre`, `apellido` | 120 |
| `celular` | 40 |
| `correo` | 200 |
| `descripcion` | 5 000 |
| `consentimientoEn` | 40 |

### Escape de HTML

El correo se envía en HTML, así que todo lo que escribió el visitante pasa por:

```ts
const escapar = (s: string): string =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', … })[c]!);
```

Sin esto, alguien podría escribir etiquetas HTML en el mensaje y alterar el correo que
recibe Laura. **Si añades un campo nuevo al correo, pásalo por `escapar()`.** El comentario
del código lo señala expresamente.

### El correo que llega

Asunto: `Nueva consulta de <nombre> <apellido>`

Cuerpo: una tabla con nombre completo, celular, correo y la marca de tiempo del
consentimiento, y debajo el texto de la consulta en un bloque destacado. Se envía en HTML y
en texto plano.

**`reply_to` lleva el correo del visitante.** Laura responde el correo directamente y la
respuesta le llega a quien escribió, sin tener que copiar la dirección.

### Variables de entorno

| Variable | Obligatoria | Por defecto |
|---|---|---|
| `RESEND_API_KEY` | **Sí** | — (sin ella, la función responde 500) |
| `CONTACT_TO_EMAIL` | No | `laura.lesmes@psyconova.com` |
| `CONTACT_FROM_EMAIL` | No | `PSYCONOVA <onboarding@resend.dev>` |

Se configuran en Netlify: **Site configuration → Environment variables**. Ver
[09 · Despliegue](./09-despliegue-y-operacion.md).

Sobre `CONTACT_FROM_EMAIL`: `onboarding@resend.dev` es el remitente de pruebas de Resend,
que funciona sin verificar dominio. Para que los correos salgan desde `@psyconova.com` sin
caer en spam hay que verificar el dominio en Resend y crear los registros DNS (SPF, DKIM,
DMARC) en Squarespace Domains.

## Probar en local

El formulario **no funciona** con `npm start` solo: `/.netlify/functions/contact` no existe
en el servidor de desarrollo de Angular. Verás el estado de error, que es el comportamiento
correcto.

Para probarlo de verdad:

```bash
npm install -g netlify-cli
cd psyconova-frontend
netlify dev
```

`netlify dev` levanta Angular y las funciones a la vez, en el mismo puerto. Necesitas
además una clave de Resend en un archivo `.env` local:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
CONTACT_TO_EMAIL=tu-correo-de-pruebas@ejemplo.com
```

⚠️ **`.env` no está en el `.gitignore` del proyecto.** Antes de crearlo, añade la línea
`.env` al `.gitignore`, o córrelo fuera del repositorio. Una clave de API en el historial de
Git es un problema serio y difícil de deshacer.

Para probar sólo la función, sin interfaz:

```bash
curl -X POST http://localhost:8888/.netlify/functions/contact \
  -H "content-type: application/json" \
  -d '{"nombre":"Prueba","apellido":"Local","celular":"3000000000",
       "correo":"prueba@ejemplo.com","descripcion":"Mensaje de prueba",
       "consentimientoEn":"2026-08-28T12:00:00.000Z","website":""}'
```

Y para comprobar que el filtro de bots funciona, manda lo mismo con
`"website":"soy-un-bot"`: debe responder `{"ok":true}` **sin que llegue ningún correo**.

## Qué revisar si dejan de llegar consultas

Este es el fallo con más impacto del proyecto y el más silencioso: **si el formulario deja
de funcionar, nadie se entera.** El visitante ve un error, pero Laura simplemente deja de
recibir correos y no tiene forma de distinguir "no hay consultas" de "el formulario está
roto".

Diagnóstico, en orden:

1. **Manda una consulta de prueba desde el sitio publicado.** Es lo primero, siempre.
2. **Mira los registros de la función.** Netlify → Functions → `contact` → Logs. La función
   escribe en consola con mensajes explícitos:
   - `RESEND_API_KEY sin configurar…` → falta o se borró la variable.
   - `Resend rechazó el envío: <código> <detalle>` → problema del lado de Resend.
   - `No se pudo contactar a Resend: …` → fallo de red.
3. **Revisa el panel de Resend.** ¿La clave sigue activa? ¿El dominio sigue verificado?
   ¿Se agotó el límite del plan gratuito (3 000 correos al mes)?
4. **Revisa la carpeta de spam** de la cuenta de destino.
5. **Comprueba que la función existe.** En Netlify → Functions debe aparecer `contact`. Si
   no está, el despliegue no la empaquetó: revisa que `netlify.toml` siga apuntando a
   `netlify/functions/`.

La recomendación de poner una prueba periódica automática está en las propuestas (P-04).

## Mejoras pendientes

Recogidas en [PROPUESTAS.md](./PROPUESTAS.md), en resumen:

- **No hay copia de respaldo de las consultas.** Si un correo se pierde o se borra por error,
  el contacto desaparece. Guardar cada consulta también en otro sitio es barato.
- **No hay aviso al visitante de que su consulta se guardó**, más allá del mensaje en
  pantalla. Un correo automático de acuse daría confianza.
- **No hay límite de envíos.** Un bot que sortee el campo trampa puede enviar sin freno.
- **La validación del correo es una expresión regular simple.** Acepta direcciones
  inexistentes; sólo comprueba la forma.

---

**Siguiente:** [08 · Contenido y assets](./08-contenido-y-assets.md) — imágenes, logos y el
cuento.

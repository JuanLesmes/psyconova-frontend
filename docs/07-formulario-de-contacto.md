# 07 · Formulario de contacto

Es la única funcionalidad del sitio que involucra un servidor, y la única por la que entra
negocio. Este documento cubre el recorrido completo: del navegador al correo de contacto
del negocio.

## El recorrido completo

1. El visitante llena el formulario y marca el consentimiento.
2. Pulsa "Generar consulta" → `CtaSection.onSubmit()`.
3. `CtaSection` llama a `ContactService.send()` con los siete campos, añadiendo
   `consentimientoEn: new Date().toISOString()`.
4. `POST /.netlify/functions/contact` (JSON).
5. La función valida con `validarConsulta()` (ver más abajo). Si todo está bien:
6. `POST https://api.resend.com/emails` con la cabecera `authorization: Bearer <clave>`.
7. Resend responde `200`.
8. La función responde `{ ok: true }` con estado `200`.
9. El componente pasa a estado `success` y muestra el mensaje de confirmación.
10. En paralelo, Resend entrega el correo al buzón de contacto, con `reply_to` = el correo
    del visitante.

**Aquí y sólo aquí**, en la función serverless, vive `RESEND_API_KEY`. Nunca llega al
navegador. Ese es todo el motivo por el que esa función existe.

Los dos caminos de fallo: la función responde un código 4xx/5xx, o no responde → el
componente pasa a estado `error` → el visitante ve el mensaje con el correo de contacto como
alternativa. **Nunca se muestra confirmación si el envío falló.**

## Las cinco piezas

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Componente | [`cta-section.ts/.html`](../psyconova-frontend/src/app/features/home/components/cta-section/) | Formulario, validación básica, estados visibles |
| Servicio | [`contact.service.ts`](../psyconova-frontend/src/app/core/services/contact.service.ts) | Hacer el `POST`. No sabe a dónde |
| Configuración | [`contact.config.ts`](../psyconova-frontend/src/app/core/config/contact.config.ts) | La URL de destino y los datos públicos |
| Reglas de validación | [`core/contact/contact-rules.ts`](../psyconova-frontend/src/app/core/contact/contact-rules.ts) | Recortar, validar, filtrar bots, escapar HTML. Puro y probado |
| Función serverless | [`netlify/functions/contact.mts`](../psyconova-frontend/netlify/functions/contact.mts) | Recibir el `POST`, aplicar las reglas y enviar por Resend |

Esa separación existe para que cambiar de proveedor de correo no toque el componente: se
cambia `CONTACT_ENDPOINT` y ya. Y las reglas están fuera de la función por un motivo
concreto: el corredor de pruebas sólo mira `src/**` (`tsconfig.spec.json`), así que lo que
se quede en `netlify/functions/` no se puede probar. `contact-rules.ts` lo importan los dos,
la función y las pruebas.

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
en el correo que recibe el negocio. Ver [10 · Privacidad y legal](./10-privacidad-y-legal.md).

## Estados del formulario

```ts
type SubmitState = 'idle' | 'sending' | 'success' | 'error';
```

El estado es una signal (`state`) y la plantilla lee tres `computed()` derivados:

| Estado | Qué ve el visitante | `computed()` en la plantilla |
|---|---|---|
| `idle` | Formulario editable. Botón activo sólo si el consentimiento está marcado | |
| `sending` | Botón deshabilitado, "Enviando…" | `isSending()` |
| `success` | Confirmación; el formulario desaparece y los campos se vacían | `submitted()` |
| `error` | Mensaje de error + correo alternativo; **los datos siguen ahí** | `hasError()` |

Transiciones: `idle → sending` (pulsar enviar) · `sending → success` (respuesta OK) ·
`sending → error` (cualquier fallo) · `error → sending` (reintentar). `success` es el único
estado que borra el formulario, y sólo se alcanza si el servidor confirmó el envío.

## Defensas del formulario

**1. Consentimiento obligatorio.** Doble comprobación: el botón está deshabilitado
(`[disabled]="!form.consentimiento || isSending()"`) y `onSubmit()` vuelve a comprobarlo
antes de hacer nada. La función serverless lo comprueba una tercera vez.

**2. Campo trampa (honeypot).** Un campo llamado `website`, oculto por CSS, con
`tabindex="-1"`, `autocomplete="off"` y `aria-hidden="true"`. Una persona nunca lo llena;
un bot que rellena todos los campos del formulario, sí.

```ts
if (recortar(datos.website, LIMITES.website) !== '') {
  return { estado: 'bot' };
}
```

Y la función responde `{ ok: true }` con **200, como si hubiera funcionado**. Es deliberado:
si devolviera un error, el bot sabría que fue detectado y volvería a intentarlo de otra
forma. La trampa se revisa **antes** que cualquier otra validación, para que un bot no
aprenda qué campos le faltan por los mensajes de error.

**3. Validación del navegador.** Los campos llevan `required` y el correo `type="email"`.
Es una red muy fina (se salta con las herramientas de desarrollo); por eso la validación
real está en el servidor.

**4. Límite de tamaño.** La función rechaza cuerpos de más de 20 000 bytes.

**5. Doble envío.** Mientras `state` es `sending`, `onSubmit()` no hace nada.

**Lo que NO hay:** captcha, límite de envíos por IP (*rate limiting*), ni verificación del
correo. Si aparece spam real, el siguiente paso es un captcha.

## La función serverless

📁 [`netlify/functions/contact.mts`](../psyconova-frontend/netlify/functions/contact.mts)

Recibe la consulta y la reenvía por correo usando Resend.

**Por qué existe:** la clave de API de Resend no puede estar en el navegador. Cualquiera
podría leerla y usarla para enviar correos en nombre de PSYCONOVA. La clave vive en las
variables de entorno de Netlify y sólo esta función la ve.

Se queda con lo que depende del entorno: la petición HTTP, las variables de entorno y la
llamada a Resend. Todo lo demás lo hace `contact-rules.ts`.

### Validaciones y respuestas

| Comprobación | Dónde | Respuesta si falla |
|---|---|---|
| Método `POST` | función | `405 method_not_allowed` |
| Cuerpo ≤ 20 000 bytes | función | `413 payload_too_large` |
| JSON válido | función | `400 invalid_json` |
| Campo trampa vacío | `validarConsulta()` | `200 { ok: true }`, sin enviar nada |
| 5 campos obligatorios presentes | `validarConsulta()` | `400 missing_fields` + lista completa de los que faltan |
| Correo con forma válida | `validarConsulta()` | `400 invalid_email` |
| Marca de consentimiento presente | `validarConsulta()` | `400 missing_consent` |
| `RESEND_API_KEY` configurada | función | `500 not_configured` |
| Resend acepta el envío | función | `502 send_failed` |
| Todo bien | | `200 { ok: true }` |

El fallo más probable en producción es el `500 not_configured`: clave ausente, caducada o
revocada.

Cada campo se **recorta** a un largo máximo antes de usarse, en vez de rechazarse: alguien
que escribe de más no debería perder su consulta entera por pasarse de largo.

```ts
export function recortar(valor: unknown, maximo: number): string {
  return typeof valor === 'string' ? valor.trim().slice(0, maximo) : '';
}
```

| Campo | Máximo (`LIMITES`) |
|---|---|
| `nombre`, `apellido` | 120 |
| `celular` | 40 |
| `correo` | 200 |
| `descripcion` | 5 000 |
| `consentimientoEn` | 40 |
| `website` | 200 (sólo se mira si trae algo) |

La comprobación del correo es deliberadamente laxa (`algo@algo.xx`): un patrón estricto
rechaza direcciones legítimas, y perder una consulta buena cuesta mucho más que dejar pasar
una mal escrita, que además rebotará sola.

### Escape de HTML

El correo se envía en HTML, así que todo lo que escribió el visitante pasa por
`escaparHtml()`:

```ts
export function escaparHtml(valor: string): string {
  return valor.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', … })[c]!);
}
```

Sin esto, alguien podría escribir etiquetas HTML en el mensaje y alterar el correo que
recibe el negocio. **Si añades un campo nuevo al correo, pásalo por `escaparHtml()`.**

### El correo que llega

Asunto: `Nueva consulta de <nombre> <apellido>`

Cuerpo: una tabla con nombre completo, celular, correo y la marca de tiempo del
consentimiento ("Autorización de datos"), y debajo el texto de la consulta en un bloque
destacado. Se envía en HTML y en texto plano.

**`reply_to` lleva el correo del visitante.** Quien recibe la consulta responde el correo
directamente y la respuesta le llega a quien escribió, sin tener que copiar la dirección.

### Variables de entorno

| Variable | Obligatoria | Por defecto |
|---|---|---|
| `RESEND_API_KEY` | **Sí** | Ninguno (sin ella, la función responde 500) |
| `CONTACT_TO_EMAIL` | No | `CONTACT_INFO.email` de `contact.config.ts`. El correo no está escrito dos veces: si cambia ahí, cambia el destino |
| `CONTACT_FROM_EMAIL` | No | `PSYCONOVA <hola@send.psyconova.com>`, el subdominio verificado en Resend |

Se configuran en Netlify: **Site configuration → Environment variables**. Ver
[09 · Despliegue](./09-despliegue-y-operacion.md).

Sobre `CONTACT_FROM_EMAIL`: el remitente por defecto usa el subdominio `send.psyconova.com`,
que está verificado en Resend con sus registros DNS (SPF, DKIM, DMARC) en Squarespace
Domains. El remitente de pruebas de Resend (`onboarding@resend.dev`) sólo permite enviar al
correo del titular de la cuenta, y si se usa por error falla con un 403 que parece un
problema de dominio sin verificar.

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

Las reglas de validación no necesitan nada de esto: `contact-rules.spec.ts` (30 pruebas)
las cubre en el corredor normal, y `cta-section.spec.ts` (11 pruebas) cubre el componente
con un `HttpTestingController`.

## Qué revisar si dejan de llegar consultas

Este es el fallo con más impacto del proyecto y el más silencioso: **si el formulario deja
de funcionar, nadie se entera.** El visitante ve un error, pero el negocio simplemente deja
de recibir correos y no tiene forma de distinguir "no hay consultas" de "el formulario está
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
6. **Comprueba la CSP.** `connect-src 'self'` sólo permite peticiones al propio dominio; si
   `CONTACT_ENDPOINT` apunta a otro sitio, hay que autorizarlo en
   `scripts/generate-csp.mjs`.

## Limitaciones conocidas

- **No hay copia de respaldo de las consultas.** Si un correo se pierde o se borra por error,
  el contacto desaparece. Guardar cada consulta también en otro sitio es barato, pero exige
  actualizar antes la política de privacidad.
- **No hay aviso al visitante de que su consulta se guardó**, más allá del mensaje en
  pantalla. Un correo automático de acuse daría confianza.
- **No hay límite de envíos.** Un bot que sortee el campo trampa puede enviar sin freno.
- **La validación del correo es una expresión regular simple.** Acepta direcciones
  inexistentes; sólo comprueba la forma.
- **No hay una prueba periódica automática** de que el formulario sigue enviando. La
  revisión mensual de [09 · Despliegue](./09-despliegue-y-operacion.md#revisión-mensual-sugerida)
  la sustituye.

---

**Siguiente:** [08 · Contenido y assets](./08-contenido-y-assets.md): imágenes, logos,
fuentes y el cuento.

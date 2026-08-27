# Despliegue de PSYCONOVA en Netlify

La configuración de build vive en [`netlify.toml`](./netlify.toml) y ya contempla que la
app de Angular está en `psyconova-frontend/` y no en la raíz del repositorio.

## 1. Crear el sitio

En Netlify: **Add new site → Import an existing project** y conecta este repositorio.
No hay que llenar nada a mano: `netlify.toml` ya define el directorio base, el comando
de build, la carpeta publicada, las funciones y el redirect de SPA.

Verifica en el registro del primer despliegue que la carpeta publicada sea
`psyconova-frontend/dist/psyconova-frontend/browser`. Si no lo es, el sitio se
despliega vacío.

## 2. Configurar el envío de consultas

El formulario de contacto hace `POST` a `/.netlify/functions/contact`. Esa función
—[`psyconova-frontend/netlify/functions/contact.mts`](./psyconova-frontend/netlify/functions/contact.mts)—
reenvía la consulta por correo usando Resend. **La clave de API vive en Netlify y nunca
llega al navegador**: ese es el motivo de que exista la función.

### 2.1 Crear la cuenta de Resend

1. Regístrate en [resend.com](https://resend.com) (el plan gratuito cubre 3.000 correos
   al mes, de sobra para un formulario de contacto).
2. Crea una API key en **API Keys**. Cópiala: solo se muestra una vez.

### 2.2 Verificar el dominio

Para que los correos salgan desde `@psyconova.com` sin caer en spam hay que verificar
el dominio. En Resend: **Domains → Add Domain → psyconova.com**. Te dará registros DNS
(SPF, DKIM y DMARC) que hay que crear en **Squarespace Domains**, que es donde vive el
dominio desde que Google vendió el negocio.

> La propagación de DNS puede tardar horas. Mientras tanto el sitio funciona:
> la variable `CONTACT_FROM_EMAIL` acepta `onboarding@resend.dev`, el remitente de
> pruebas de Resend, que envía sin verificación.

### 2.3 Variables de entorno

En Netlify: **Site configuration → Environment variables**.

| Variable | Valor | Obligatoria |
|---|---|---|
| `RESEND_API_KEY` | La clave del paso 2.1 | Sí |
| `CONTACT_TO_EMAIL` | `laura.lesmes@psyconova.com` | No (es el valor por defecto) |
| `CONTACT_FROM_EMAIL` | `PSYCONOVA <hola@psyconova.com>` una vez verificado el dominio | No (por defecto usa el remitente de pruebas) |

Sin `RESEND_API_KEY` la función responde 500 y el formulario muestra un error visible
al visitante, con el correo como alternativa. **Nunca finge que la consulta se envió.**

## 3. Probar antes de anunciar el sitio

Envía una consulta real desde el sitio publicado y confirma tres cosas:

1. Que el correo llega a `laura.lesmes@psyconova.com`.
2. Que **no** cayó en spam (revisa esa carpeta).
3. Que al responder ese correo, la respuesta va al visitante: la función pone su
   dirección en `reply_to`.

## Notas de operación

- **Créditos de Netlify.** El plan Pro trae 3.000 créditos al mes. El tráfico consume
  20 créditos por GB y cada despliegue a producción 15. Conviene activar la recarga
  automática para que el sitio no se pause si hay un pico de visitas.
- **Imágenes.** Los originales están en `psyconova-frontend/design/source-images/` y no
  se despliegan. Al agregar imágenes nuevas, déjalas ahí y corre
  `npm run optimize:images`, que genera los WebP en `src/assets/images/`.
- **Spam.** El formulario trae un campo trampa oculto (`website`). Si llega con
  contenido, la función responde 200 sin enviar nada, para que el bot no sepa que fue
  detectado. Si aparece spam real pese a eso, el siguiente paso es un captcha.

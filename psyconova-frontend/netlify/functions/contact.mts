import type { Context } from '@netlify/functions';
import {
  escaparHtml,
  validarConsulta,
  type ConsultaCruda,
  type ConsultaValida,
} from '../../src/app/core/contact/contact-rules';

/**
 * Recibe las consultas del formulario de contacto y las reenvía por correo.
 *
 * La clave de Resend vive en las variables de entorno de Netlify y nunca llega
 * al navegador: ese es el motivo de que exista esta función en vez de enviar
 * directamente desde el front.
 *
 * Las reglas de validación NO están aquí, sino en src/app/core/contact/
 * contact-rules.ts, para que el corredor de pruebas pueda alcanzarlas. Este
 * archivo se queda con lo que sí depende del entorno: la petición HTTP, las
 * variables de entorno y la llamada a Resend.
 *
 * Variables de entorno (Netlify → Site configuration → Environment variables):
 *   RESEND_API_KEY      obligatoria. Se crea en resend.com/api-keys
 *   CONTACT_TO_EMAIL    destino de las consultas
 *   CONTACT_FROM_EMAIL  remitente. Requiere dominio verificado en Resend
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const MAX_BODY_BYTES = 20_000;

const DEFAULT_TO = 'laura.lesmes@psyconova.com';

/**
 * Remitente por defecto. Usa el subdominio verificado en Resend.
 *
 * Antes apuntaba a onboarding@resend.dev, el remitente de pruebas, que sólo
 * permite enviar al correo del titular de la cuenta. Si la variable de entorno
 * no llegaba a la función, el envío fallaba con un 403 confuso que parecía un
 * problema de dominio sin verificar. Con el dominio ya verificado, éste es el
 * valor correcto y la variable sólo hace falta para cambiarlo.
 */
const DEFAULT_FROM = 'PSYCONOVA <hola@send.psyconova.com>';

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

/** Arma el cuerpo del correo. Aparte para no mezclarlo con el flujo HTTP. */
const componerCorreo = (c: ConsultaValida) => {
  const lineas: [string, string][] = [
    ['Nombre', `${c.nombre} ${c.apellido}`],
    ['Celular', c.celular],
    ['Correo', c.correo],
    ['Autorización de datos', c.consentimientoEn],
  ];

  const html = `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#19206d;line-height:1.6">
      <h2 style="margin:0 0 1rem;font-size:18px">Nueva consulta desde el sitio</h2>
      <table style="border-collapse:collapse;font-size:14px">
        ${lineas
          .map(
            ([k, v]) =>
              `<tr><td style="padding:4px 16px 4px 0;color:#5f677e">${k}</td>` +
              `<td style="padding:4px 0"><strong>${escaparHtml(v)}</strong></td></tr>`
          )
          .join('')}
      </table>
      <p style="margin:1.5rem 0 0.4rem;color:#5f677e;font-size:14px">Consulta</p>
      <div style="white-space:pre-wrap;background:#f7f4ff;border-left:3px solid #7b69e7;
                  padding:12px 16px;border-radius:4px;font-size:15px">${escaparHtml(c.descripcion)}</div>
    </div>`;

  const texto =
    lineas.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nConsulta:\n${c.descripcion}\n`;

  return { html, texto };
};

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const crudo = await req.text();
  if (crudo.length > MAX_BODY_BYTES) {
    return json({ error: 'payload_too_large' }, 413);
  }

  let datos: ConsultaCruda;
  try {
    datos = JSON.parse(crudo) as ConsultaCruda;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const resultado = validarConsulta(datos);

  // Cayó en la trampa. Se responde 200 a propósito: si devolviéramos un error,
  // el bot sabría que fue detectado y volvería a intentar de otra forma.
  if (resultado.estado === 'bot') {
    return json({ ok: true }, 200);
  }

  if (resultado.estado === 'invalido') {
    return json(
      resultado.campos ? { error: resultado.error, fields: resultado.campos } : { error: resultado.error },
      400
    );
  }

  const consulta = resultado.consulta;

  const apiKey = process.env['RESEND_API_KEY'];
  if (!apiKey) {
    console.error('RESEND_API_KEY sin configurar: la consulta no se pudo enviar.');
    return json({ error: 'not_configured' }, 500);
  }

  const para = process.env['CONTACT_TO_EMAIL'] || DEFAULT_TO;
  const desde = process.env['CONTACT_FROM_EMAIL'] || DEFAULT_FROM;
  const { html, texto } = componerCorreo(consulta);

  try {
    const respuesta = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: desde,
        to: [para],
        // Responder al correo lleva directo a quien escribió.
        reply_to: consulta.correo,
        subject: `Nueva consulta de ${consulta.nombre} ${consulta.apellido}`,
        html,
        text: texto,
      }),
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      console.error('Resend rechazó el envío:', respuesta.status, detalle);
      return json({ error: 'send_failed' }, 502);
    }

    return json({ ok: true }, 200);
  } catch (error) {
    console.error('No se pudo contactar a Resend:', error);
    return json({ error: 'send_failed' }, 502);
  }
};

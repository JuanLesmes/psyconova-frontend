import type { Context } from '@netlify/functions';
import {
  escaparHtml,
  validarConsulta,
  type ConsultaCruda,
  type ConsultaValida,
} from '../../src/app/core/contact/contact-rules';
import { CONTACT_INFO } from '../../src/app/core/config/contact.config';

/**
 * Recibe las consultas del formulario de contacto y las reenvía por correo.
 * Existe porque la clave de Resend vive en las variables de entorno de Netlify
 * y nunca llega al navegador. Las reglas de validación están en
 * src/app/core/contact/contact-rules.ts, donde el corredor de pruebas las
 * alcanza; aquí queda lo que depende del entorno (petición HTTP, variables y
 * llamada a Resend). Variables (Netlify → Site configuration → Environment
 * variables): RESEND_API_KEY (obligatoria, se crea en resend.com/api-keys),
 * CONTACT_TO_EMAIL (destino) y CONTACT_FROM_EMAIL (remitente con dominio verificado).
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const MAX_BODY_BYTES = 20_000;

/** Destino por defecto: el mismo correo público de contact.config, para que no diverjan. */
const DEFAULT_TO = CONTACT_INFO.email;

/**
 * Remitente por defecto: el subdominio verificado en Resend. Con el remitente
 * de pruebas (onboarding@resend.dev) sólo se puede enviar al correo del
 * titular de la cuenta, y si la variable de entorno no llega a la función el
 * envío falla con un 403 que parece un dominio sin verificar.
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

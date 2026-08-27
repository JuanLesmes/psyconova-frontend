import type { Context } from '@netlify/functions';

/**
 * Recibe las consultas del formulario de contacto y las reenvía por correo.
 *
 * La clave de Resend vive en las variables de entorno de Netlify y nunca llega
 * al navegador: ese es el motivo de que exista esta función en vez de enviar
 * directamente desde el front.
 *
 * Variables de entorno (Netlify → Site configuration → Environment variables):
 *   RESEND_API_KEY      obligatoria. Se crea en resend.com/api-keys
 *   CONTACT_TO_EMAIL    destino de las consultas
 *   CONTACT_FROM_EMAIL  remitente. Requiere dominio verificado en Resend;
 *                       mientras se verifica sirve onboarding@resend.dev
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const MAX_BODY_BYTES = 20_000;

const DEFAULT_TO = 'laura.lesmes@psyconova.com';
const DEFAULT_FROM = 'PSYCONOVA <onboarding@resend.dev>';

interface Consulta {
  nombre?: unknown;
  apellido?: unknown;
  celular?: unknown;
  correo?: unknown;
  descripcion?: unknown;
  consentimientoEn?: unknown;
  /** Trampa para bots: si viene con contenido, no es una persona. */
  website?: unknown;
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const texto = (valor: unknown, maximo: number): string =>
  typeof valor === 'string' ? valor.trim().slice(0, maximo) : '';

/** El correo se envía como HTML: sin esto, el mensaje del visitante podría inyectar etiquetas. */
const escapar = (s: string): string =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const crudo = await req.text();
  if (crudo.length > MAX_BODY_BYTES) {
    return json({ error: 'payload_too_large' }, 413);
  }

  let datos: Consulta;
  try {
    datos = JSON.parse(crudo) as Consulta;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  // Trampa para bots. Se responde 200 a propósito: si devolviéramos un error,
  // el bot sabría que fue detectado y volvería a intentar de otra forma.
  if (texto(datos.website, 200) !== '') {
    return json({ ok: true }, 200);
  }

  const nombre = texto(datos.nombre, 120);
  const apellido = texto(datos.apellido, 120);
  const celular = texto(datos.celular, 40);
  const correo = texto(datos.correo, 200);
  const descripcion = texto(datos.descripcion, 5000);
  const consentimientoEn = texto(datos.consentimientoEn, 40);

  const faltantes = Object.entries({ nombre, apellido, celular, correo, descripcion })
    .filter(([, v]) => v === '')
    .map(([k]) => k);

  if (faltantes.length > 0) {
    return json({ error: 'missing_fields', fields: faltantes }, 400);
  }

  if (!CORREO_VALIDO.test(correo)) {
    return json({ error: 'invalid_email' }, 400);
  }

  // Sin autorización de tratamiento de datos no se procesa nada (Ley 1581 de 2012).
  if (consentimientoEn === '') {
    return json({ error: 'missing_consent' }, 400);
  }

  const apiKey = process.env['RESEND_API_KEY'];
  if (!apiKey) {
    console.error('RESEND_API_KEY sin configurar: la consulta no se pudo enviar.');
    return json({ error: 'not_configured' }, 500);
  }

  const para = process.env['CONTACT_TO_EMAIL'] || DEFAULT_TO;
  const desde = process.env['CONTACT_FROM_EMAIL'] || DEFAULT_FROM;

  const lineas = [
    ['Nombre', `${nombre} ${apellido}`],
    ['Celular', celular],
    ['Correo', correo],
    ['Autorización de datos', consentimientoEn],
  ];

  const html = `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#19206d;line-height:1.6">
      <h2 style="margin:0 0 1rem;font-size:18px">Nueva consulta desde el sitio</h2>
      <table style="border-collapse:collapse;font-size:14px">
        ${lineas
          .map(
            ([k, v]) =>
              `<tr><td style="padding:4px 16px 4px 0;color:#5f677e">${k}</td>` +
              `<td style="padding:4px 0"><strong>${escapar(v)}</strong></td></tr>`
          )
          .join('')}
      </table>
      <p style="margin:1.5rem 0 0.4rem;color:#5f677e;font-size:14px">Consulta</p>
      <div style="white-space:pre-wrap;background:#f7f4ff;border-left:3px solid #7b69e7;
                  padding:12px 16px;border-radius:4px;font-size:15px">${escapar(descripcion)}</div>
    </div>`;

  const plano =
    lineas.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nConsulta:\n${descripcion}\n`;

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
        reply_to: correo,
        subject: `Nueva consulta de ${nombre} ${apellido}`,
        html,
        text: plano,
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

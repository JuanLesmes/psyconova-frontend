/**
 * Reglas de validación de una consulta de contacto.
 *
 * Vive aquí, y no dentro de la función serverless, por un motivo concreto:
 * el corredor de pruebas sólo mira `src/**` (ver tsconfig.spec.json), así que
 * lo que se quede en netlify/functions/ no se puede probar. Este módulo lo
 * importan los dos — la función al recibir el POST, y las pruebas.
 *
 * Todo lo de aquí es puro: no toca red, ni entorno, ni reloj. Esa es la
 * condición para poder probarlo sin montar nada.
 */

/** Tamaño máximo de cada campo. Lo que pase de aquí se recorta, no se rechaza. */
export const LIMITES = {
  nombre: 120,
  apellido: 120,
  celular: 40,
  correo: 200,
  descripcion: 5000,
  consentimientoEn: 40,
  /** El campo trampa. Se lee sólo para saber si trae algo. */
  website: 200,
} as const;

/** Lo que llega por el cuerpo del POST: cualquier cosa, sin garantías. */
export interface ConsultaCruda {
  nombre?: unknown;
  apellido?: unknown;
  celular?: unknown;
  correo?: unknown;
  descripcion?: unknown;
  consentimientoEn?: unknown;
  /** Trampa para bots: si viene con contenido, no es una persona. */
  website?: unknown;
}

/** Lo que sale si la consulta es buena: todo string, todo dentro de límites. */
export interface ConsultaValida {
  nombre: string;
  apellido: string;
  celular: string;
  correo: string;
  descripcion: string;
  consentimientoEn: string;
}

export type ResultadoValidacion =
  | { estado: 'ok'; consulta: ConsultaValida }
  /** Cayó en la trampa. Quien llama debe responder 200 igualmente. */
  | { estado: 'bot' }
  | { estado: 'invalido'; error: string; campos?: string[] };

/**
 * Convierte lo que sea en un string acotado.
 *
 * Recorta en vez de rechazar a propósito: alguien que escribe de más no
 * debería perder su consulta entera por pasarse de largo. Lo que no sea
 * string (número, objeto, null) se descarta como vacío, y entonces el campo
 * cae en la lista de faltantes si era obligatorio.
 */
export function recortar(valor: unknown, maximo: number): string {
  return typeof valor === 'string' ? valor.trim().slice(0, maximo) : '';
}

/**
 * Escapa el texto del visitante antes de meterlo en el correo.
 *
 * El correo se envía como HTML. Sin esto, cualquiera podría escribir
 * etiquetas en el mensaje y que le llegaran interpretadas a la psicóloga.
 */
export function escaparHtml(valor: string): string {
  return valor.replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );
}

/**
 * Comprobación deliberadamente laxa: algo, arroba, algo, punto, dos letras.
 *
 * No intenta validar el estándar completo. Un patrón estricto rechaza
 * direcciones legítimas — con signos de suma, con dominios largos, con
 * caracteres poco comunes — y perder una consulta buena cuesta mucho más
 * que dejar pasar una mal escrita, que además rebotará sola.
 */
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function esCorreoValido(correo: string): boolean {
  return CORREO.test(correo);
}

/** Los campos que el visitante tiene que llenar sí o sí. */
const OBLIGATORIOS = ['nombre', 'apellido', 'celular', 'correo', 'descripcion'] as const;

/**
 * Decide si una consulta se envía, se descarta en silencio o se rechaza.
 *
 * El orden importa y no es casual:
 *
 *   1. La trampa de bots va PRIMERO. Si respondiéramos después de validar,
 *      un bot aprendería qué campos le faltan por los mensajes de error.
 *   2. Campos obligatorios, todos de una vez, para que el visitante vea
 *      todo lo que le falta en un solo intento.
 *   3. Formato del correo.
 *   4. Consentimiento, que es requisito legal (Ley 1581 de 2012).
 */
export function validarConsulta(datos: ConsultaCruda): ResultadoValidacion {
  if (recortar(datos.website, LIMITES.website) !== '') {
    return { estado: 'bot' };
  }

  const consulta: ConsultaValida = {
    nombre: recortar(datos.nombre, LIMITES.nombre),
    apellido: recortar(datos.apellido, LIMITES.apellido),
    celular: recortar(datos.celular, LIMITES.celular),
    correo: recortar(datos.correo, LIMITES.correo),
    descripcion: recortar(datos.descripcion, LIMITES.descripcion),
    consentimientoEn: recortar(datos.consentimientoEn, LIMITES.consentimientoEn),
  };

  const faltantes = OBLIGATORIOS.filter(campo => consulta[campo] === '');
  if (faltantes.length > 0) {
    return { estado: 'invalido', error: 'missing_fields', campos: [...faltantes] };
  }

  if (!esCorreoValido(consulta.correo)) {
    return { estado: 'invalido', error: 'invalid_email' };
  }

  if (consulta.consentimientoEn === '') {
    return { estado: 'invalido', error: 'missing_consent' };
  }

  return { estado: 'ok', consulta };
}

/**
 * Cuentos terapéuticos con acceso por palabra clave.
 *
 * La comprobación ocurre en el navegador, así que no es control de acceso
 * real: quien abra las herramientas de desarrollo puede leer las claves o
 * pedir el archivo por su URL. Sirve para que el cuento se entregue en consulta
 * y no quede suelto para cualquiera que pase por el sitio. Si hace falta
 * control real, el camino es una función serverless que valide la clave.
 */
export const TALE = {
  /** Ruta del archivo dentro de assets. */
  file: 'assets/cuentos/las-manadas.html',

  /**
   * Palabras clave aceptadas. Se comparan sin tildes, sin espacios sobrantes
   * y sin distinguir mayúsculas, para que un error pequeño al escribirla no
   * frustre a una familia.
   */
  codes: ['manada', 'las manadas'],
};

/**
 * Normaliza lo que escribe el usuario para poder compararlo.
 *
 * `\p{Diacritic}` con la bandera `u` quita los acentos que NFD acaba de
 * separar de su letra. Se usa esta forma y no un rango de caracteres porque
 * un rango de combinantes son símbolos invisibles en el código, imposibles
 * de revisar y fáciles de romper sin que se note.
 */
export function normalizeCode(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ');
}

/** ¿La palabra escrita abre el cuento? */
export function isValidTaleCode(value: string): boolean {
  const escrito = normalizeCode(value);
  return escrito !== '' && TALE.codes.some(code => normalizeCode(code) === escrito);
}

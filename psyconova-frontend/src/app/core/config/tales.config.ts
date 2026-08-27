/**
 * Cuentos terapéuticos con acceso por palabra clave.
 *
 * ⚠️ LEE ESTO ANTES DE CONFIAR EN LA PALABRA CLAVE
 *
 * Esta comprobación ocurre en el navegador, así que NO es control de acceso
 * real: alguien con conocimientos puede abrir las herramientas de desarrollo,
 * leer las claves de aquí y entrar sin ellas, o pedir el archivo directamente
 * por su URL.
 *
 * Sirve para lo que probablemente se busca — que el cuento se entregue en
 * consulta y no quede suelto para cualquiera que pase por el sitio — pero no
 * para proteger algo que de verdad no pueda verse.
 *
 * Si hace falta control real, el camino es una función serverless que valide
 * la clave en el servidor y devuelva el cuento sólo entonces.
 */
export const TALE = {
  /** Ruta del archivo dentro de assets. */
  file: 'assets/cuentos/las-manadas.html',

  /**
   * Palabras clave aceptadas. Se comparan sin tildes, sin espacios sobrantes
   * y sin distinguir mayúsculas, para que escribirla mal por poco no frustre
   * a una familia. Para cambiarlas, edita esta lista.
   */
  codes: ['manada', 'las manadas'],
};

/**
 * Normaliza lo que escribe el usuario antes de comparar.
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

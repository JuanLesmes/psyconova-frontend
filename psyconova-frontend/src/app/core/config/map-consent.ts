import { MAP_CONSENT_KEY } from './contact.config';

/**
 * Decisión del visitante sobre el mapa de Google.
 *
 *   null   todavía no ha decidido: se le pregunta
 *   true   aceptó: se carga el iframe
 *   false  rechazó: se muestra la dirección y no se vuelve a preguntar
 *
 * Son tres estados y no dos porque «dijo que no» es distinto de «nunca se le
 * preguntó». Con un booleano no se podrían separar, y habría que volver a
 * preguntar en cada visita a quien ya rechazó.
 */
export type MapConsent = boolean | null;

/**
 * Interpreta el valor guardado en localStorage.
 *
 * Sólo '1' cuenta como aceptado y sólo '0' como rechazado. Cualquier otra
 * cosa (basura, una versión antigua de la clave, un booleano guardado como
 * texto) se trata como «sin decidir». Nunca como aceptado: eso cargaría
 * Google sin permiso y nadie lo notaría, porque el sitio se vería igual.
 */
export function interpretarConsentimientoMapa(guardado: string | null): MapConsent {
  if (guardado === '1') return true;
  if (guardado === '0') return false;
  return null;
}

/** Lee la decisión guardada. Sin almacenamiento disponible, se pregunta de nuevo. */
export function leerConsentimientoMapa(): MapConsent {
  try {
    return interpretarConsentimientoMapa(localStorage.getItem(MAP_CONSENT_KEY));
  } catch {
    return null;
  }
}

/**
 * Guarda la decisión. Si el almacenamiento está bloqueado (modo privado), la
 * decisión vale para esta visita y se vuelve a preguntar en la siguiente.
 */
export function guardarConsentimientoMapa(decision: boolean): void {
  try {
    localStorage.setItem(MAP_CONSENT_KEY, decision ? '1' : '0');
  } catch {
    // Sin persistencia no hay nada más que hacer.
  }
}

/** Olvida la decisión, para quien cambie de idea. */
export function olvidarConsentimientoMapa(): void {
  try {
    localStorage.removeItem(MAP_CONSENT_KEY);
  } catch {
    // Sin persistencia se vuelve a preguntar de todas formas.
  }
}

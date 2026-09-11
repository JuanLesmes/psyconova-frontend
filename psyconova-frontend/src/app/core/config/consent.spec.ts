import { describe, it, expect } from 'vitest';
import { MAP_CONSENT_KEY } from './contact.config';

/**
 * La lectura del consentimiento del mapa, aislada de Angular.
 *
 * Replica exactamente la lógica de CtaSection.readMapConsent(). Se prueba aquí
 * y no montando el componente porque lo que importa es la tabla de decisión,
 * no el renderizado: qué valor guardado produce qué estado.
 *
 * Es código que falla en silencio. Si un valor inesperado se interpretara como
 * «aceptado», el mapa cargaría sin permiso y nadie lo notaría — ni siquiera
 * quien lo rechazó, porque el sitio se vería igual de bien.
 */
function leerConsentimiento(guardado: string | null): boolean | null {
  if (guardado === '1') return true;
  if (guardado === '0') return false;
  return null;
}

describe('consentimiento del mapa', () => {
  it('la clave lleva version, para poder volver a preguntar si cambia lo que se recoge', () => {
    expect(MAP_CONSENT_KEY).toMatch(/\.v\d+$/);
  });

  it.each([
    ['aceptado', '1', true],
    ['rechazado', '0', false],
    ['sin decidir', null, null],
  ])('%s se lee como %s', (_caso, guardado, esperado) => {
    expect(leerConsentimiento(guardado)).toBe(esperado);
  });

  describe('nada que no sea un si explicito cuenta como si', () => {
    // Cualquier valor raro —basura, una clave de otra version, un booleano
    // guardado como texto— tiene que caer en «sin decidir». Nunca en aceptado:
    // eso cargaria Google sin permiso.
    it.each([
      ['texto cualquiera', 'true'],
      ['vacio', ''],
      ['un si en ingles', 'yes'],
      ['un numero distinto', '2'],
      ['espacios', ' 1 '],
      ['mayusculas', 'TRUE'],
    ])('%s no se toma por aceptado', (_caso, valor) => {
      expect(leerConsentimiento(valor)).not.toBe(true);
    });
  });

  it('rechazar es distinto de no haber decidido', () => {
    // Con un booleano no se podrian separar, y habria que volver a preguntar
    // en cada visita a quien ya dijo que no.
    expect(leerConsentimiento('0')).not.toBe(leerConsentimiento(null));
  });
});

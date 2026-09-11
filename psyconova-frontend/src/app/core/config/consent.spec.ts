import { describe, it, expect } from 'vitest';
import { MAP_CONSENT_KEY } from './contact.config';
import { interpretarConsentimientoMapa } from './map-consent';

/**
 * La lectura del consentimiento del mapa, aislada de Angular.
 *
 * Se prueba la función que usa el componente, no una copia: si cambia la
 * tabla de decisión, estas pruebas lo ven. Lo que importa es qué valor
 * guardado produce qué estado, porque es código que falla en silencio: si un
 * valor inesperado se interpretara como «aceptado», el mapa cargaría sin
 * permiso y nadie lo notaría.
 */
describe('consentimiento del mapa', () => {
  it('la clave lleva version, para poder volver a preguntar si cambia lo que se recoge', () => {
    expect(MAP_CONSENT_KEY).toMatch(/\.v\d+$/);
  });

  it.each([
    ['aceptado', '1', true],
    ['rechazado', '0', false],
    ['sin decidir', null, null],
  ])('%s se lee como %s', (_caso, guardado, esperado) => {
    expect(interpretarConsentimientoMapa(guardado)).toBe(esperado);
  });

  describe('nada que no sea un si explicito cuenta como si', () => {
    // Cualquier valor raro (basura, una clave de otra version, un booleano
    // guardado como texto) tiene que caer en «sin decidir». Nunca en
    // aceptado: eso cargaria Google sin permiso.
    it.each([
      ['texto cualquiera', 'true'],
      ['vacio', ''],
      ['un si en ingles', 'yes'],
      ['un numero distinto', '2'],
      ['espacios', ' 1 '],
      ['mayusculas', 'TRUE'],
    ])('%s no se toma por aceptado', (_caso, valor) => {
      expect(interpretarConsentimientoMapa(valor)).not.toBe(true);
    });
  });

  it('rechazar es distinto de no haber decidido', () => {
    // Con un booleano no se podrian separar, y habria que volver a preguntar
    // en cada visita a quien ya dijo que no.
    expect(interpretarConsentimientoMapa('0')).not.toBe(interpretarConsentimientoMapa(null));
  });
});

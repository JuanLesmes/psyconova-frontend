import { describe, it, expect } from 'vitest';
import { TALE, isValidTaleCode, normalizeCode } from './tales.config';

/**
 * La palabra clave la escribe una familia, muchas veces un niño, en el móvil
 * de su madre y después de una sesión. Si la comprobación es rígida, el
 * cuento no se abre y nadie sabrá por qué: no hay error, no hay aviso, sólo
 * una puerta que no cede.
 *
 * Estas pruebas fijan que escribirla "casi bien" baste.
 */

describe('isValidTaleCode · escribirla casi bien tiene que bastar', () => {
  it.each([
    ['tal cual', 'manada'],
    ['en mayúsculas', 'MANADA'],
    ['con la inicial en mayúscula', 'Manada'],
    ['con espacios delante y detrás', '  manada  '],
    ['la otra forma aceptada', 'las manadas'],
    ['la otra forma, en mayúsculas', 'LAS MANADAS'],
    ['con espacios de más en medio', 'las    manadas'],
  ])('abre el cuento si la escriben %s', (_caso, escrito) => {
    expect(isValidTaleCode(escrito)).toBe(true);
  });

  it('abre el cuento aunque le pongan una tilde de más', () => {
    // Nadie debería quedarse fuera por una tilde.
    expect(isValidTaleCode('manadá')).toBe(true);
  });
});

describe('isValidTaleCode · lo que no debe abrir', () => {
  it.each([
    ['vacío', ''],
    ['sólo espacios', '   '],
    ['otra palabra', 'lobo'],
    ['a medias', 'mana'],
    ['con texto de más', 'manada de lobos'],
  ])('no abre con %s', (_caso, escrito) => {
    expect(isValidTaleCode(escrito)).toBe(false);
  });

  it('no abre con una cadena vacía por mucho que se normalice', () => {
    // Sin esta guarda, normalizar "" y comparar con "" daría verdadero
    // y el cuento se abriría con el campo en blanco.
    expect(isValidTaleCode('')).toBe(false);
    expect(isValidTaleCode('\n\t  ')).toBe(false);
  });
});

describe('normalizeCode', () => {
  it('quita tildes, mayúsculas y espacios sobrantes', () => {
    expect(normalizeCode('  LÁS   MANÁDAS  ')).toBe('las manadas');
  });

  it('deja un solo espacio entre palabras', () => {
    expect(normalizeCode('las     manadas')).toBe('las manadas');
  });

  it('la ñ se convierte en n, y está bien que así sea', () => {
    // NFD parte la ñ en "n" + tilde combinante, y \p{Diacritic} se lleva la
    // tilde. Suena a fallo pero no lo es: la normalización se aplica a los
    // DOS lados de la comparación, así que emparejar sigue funcionando, y
    // de paso alguien con un teclado sin ñ puede escribir la clave igual.
    expect(normalizeCode('AÑO')).toBe('ano');
  });

  it('una clave con ñ seguiría abriéndose, escrita con ñ o sin ella', () => {
    // Es la prueba de que lo anterior no rompe nada. Si algún día se añade
    // una palabra con ñ a TALE.codes, las tres formas deben valer.
    const configurada = normalizeCode('El Cariño');

    expect(normalizeCode('el cariño')).toBe(configurada);
    expect(normalizeCode('EL CARINO')).toBe(configurada);
    expect(normalizeCode('  el  cariño ')).toBe(configurada);
  });
});

describe('TALE · configuración', () => {
  it('el archivo del cuento apunta dentro de assets', () => {
    expect(TALE.file).toMatch(/^assets\//);
  });

  it('hay al menos una palabra clave configurada', () => {
    // Con la lista vacía el cuento quedaría cerrado para siempre,
    // y el formulario no daría ninguna pista de por qué.
    expect(TALE.codes.length).toBeGreaterThan(0);
  });

  it('todas las palabras configuradas se aceptan a sí mismas', () => {
    // Protege de escribir una clave con una tilde o un espacio raro
    // que la propia normalización acabe rechazando.
    for (const code of TALE.codes) {
      expect(isValidTaleCode(code)).toBe(true);
    }
  });
});

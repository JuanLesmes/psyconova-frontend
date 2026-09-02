import { describe, it, expect } from 'vitest';
import {
  LIMITES,
  escaparHtml,
  esCorreoValido,
  recortar,
  validarConsulta,
} from './contact-rules';

/**
 * Estas pruebas cubren el camino por el que pasa cada consulta que llega del
 * sitio. Es código que falla en silencio: si la validación se vuelve muy
 * estricta, se pierden clientes sin que nadie vea un error; si se vuelve muy
 * laxa, entra basura o se salta el consentimiento, que es requisito legal.
 */

/** Una consulta buena, para partir de ella y romper sólo lo que cada prueba mira. */
const consultaValida = () => ({
  nombre: 'Laura',
  apellido: 'Lesmes',
  celular: '3053732503',
  correo: 'laura@ejemplo.com',
  descripcion: 'Quisiera agendar una primera sesión.',
  consentimientoEn: '2026-09-02T10:00:00.000Z',
  website: '',
});

describe('validarConsulta · una consulta legítima pasa', () => {
  it('acepta el caso normal', () => {
    const r = validarConsulta(consultaValida());
    expect(r.estado).toBe('ok');
  });

  it('no pierde ni deforma ningún dato por el camino', () => {
    const r = validarConsulta(consultaValida());
    if (r.estado !== 'ok') throw new Error('debería ser válida');

    expect(r.consulta.nombre).toBe('Laura');
    expect(r.consulta.correo).toBe('laura@ejemplo.com');
    expect(r.consulta.descripcion).toBe('Quisiera agendar una primera sesión.');
  });

  it('limpia los espacios sobrantes que deja copiar y pegar', () => {
    const r = validarConsulta({ ...consultaValida(), nombre: '  Laura  ' });
    if (r.estado !== 'ok') throw new Error('debería ser válida');

    expect(r.consulta.nombre).toBe('Laura');
  });
});

describe('validarConsulta · la trampa de bots', () => {
  it('descarta la consulta si el campo oculto viene lleno', () => {
    const r = validarConsulta({ ...consultaValida(), website: 'http://spam.example' });
    expect(r.estado).toBe('bot');
  });

  it('revisa la trampa ANTES que nada, para no delatarse', () => {
    // Un bot que rellena todo, incluida la trampa, y además manda basura:
    // si contestáramos "te faltan campos" le estaríamos enseñando el formato.
    const r = validarConsulta({ website: 'spam', nombre: '', correo: 'no-es-correo' });
    expect(r.estado).toBe('bot');
  });

  it('una persona normal no cae en la trampa', () => {
    // El campo existe en el formulario pero está oculto: llega vacío.
    const r = validarConsulta({ ...consultaValida(), website: '' });
    expect(r.estado).toBe('ok');
  });
});

describe('validarConsulta · campos obligatorios', () => {
  it('nombra TODOS los que faltan de una vez', () => {
    // Si los devolviera de uno en uno, el visitante tendría que reenviar
    // cinco veces para enterarse de todo lo que le falta.
    const r = validarConsulta({ website: '', consentimientoEn: '2026-09-02' });
    if (r.estado !== 'invalido') throw new Error('debería ser inválida');

    expect(r.error).toBe('missing_fields');
    expect(r.campos).toEqual(['nombre', 'apellido', 'celular', 'correo', 'descripcion']);
  });

  it('un campo con sólo espacios cuenta como vacío', () => {
    const r = validarConsulta({ ...consultaValida(), nombre: '     ' });
    if (r.estado !== 'invalido') throw new Error('debería ser inválida');

    expect(r.campos).toEqual(['nombre']);
  });

  it('un campo que no es texto cuenta como vacío, no revienta', () => {
    const r = validarConsulta({ ...consultaValida(), celular: 3053732503 });
    if (r.estado !== 'invalido') throw new Error('debería ser inválida');

    expect(r.campos).toEqual(['celular']);
  });

  it('el consentimiento NO va en la lista de campos del formulario', () => {
    // Tiene su propio error para poder darle un mensaje distinto:
    // no es un campo olvidado, es un permiso que no se dio.
    const r = validarConsulta({ ...consultaValida(), consentimientoEn: '' });
    if (r.estado !== 'invalido') throw new Error('debería ser inválida');

    expect(r.error).toBe('missing_consent');
  });
});

describe('validarConsulta · el consentimiento es innegociable', () => {
  it('sin autorización de datos no se envía nada (Ley 1581 de 2012)', () => {
    const r = validarConsulta({ ...consultaValida(), consentimientoEn: '' });
    expect(r.estado).toBe('invalido');
  });

  it('el consentimiento nunca se da por supuesto si falta el campo', () => {
    const { consentimientoEn: _omitido, ...sinConsentimiento } = consultaValida();
    const r = validarConsulta(sinConsentimiento);

    if (r.estado !== 'invalido') throw new Error('debería ser inválida');
    expect(r.error).toBe('missing_consent');
  });
});

describe('esCorreoValido · no rechazar direcciones legítimas', () => {
  // Cada uno de estos es una consulta perdida si la validación se pasa de lista.
  it.each([
    ['normal', 'laura@ejemplo.com'],
    ['con signo de suma', 'laura+psyconova@gmail.com'],
    ['con punto en el nombre', 'laura.lesmes@psyconova.com'],
    ['dominio colombiano', 'contacto@universidad.edu.co'],
    ['subdominio', 'hola@send.psyconova.com'],
    ['con guion', 'mi-correo@mi-dominio.com'],
  ])('acepta un correo %s', (_caso, correo) => {
    expect(esCorreoValido(correo)).toBe(true);
  });

  it.each([
    ['sin arroba', 'lauraejemplo.com'],
    ['sin dominio', 'laura@'],
    ['sin nombre', '@ejemplo.com'],
    ['sin punto', 'laura@ejemplo'],
    ['con espacio', 'lau ra@ejemplo.com'],
    ['vacío', ''],
  ])('rechaza un correo %s', (_caso, correo) => {
    expect(esCorreoValido(correo)).toBe(false);
  });
});

describe('recortar · recorta en vez de rechazar', () => {
  it('deja pasar un mensaje largo recortándolo, no lo descarta', () => {
    // Perder una consulta entera porque alguien se extendió sería peor
    // que guardar sólo los primeros 5000 caracteres.
    const largo = 'a'.repeat(LIMITES.descripcion + 500);
    const r = validarConsulta({ ...consultaValida(), descripcion: largo });

    if (r.estado !== 'ok') throw new Error('debería seguir siendo válida');
    expect(r.consulta.descripcion).toHaveLength(LIMITES.descripcion);
  });

  it('convierte lo que no sea texto en vacío sin lanzar error', () => {
    expect(recortar(null, 10)).toBe('');
    expect(recortar(undefined, 10)).toBe('');
    expect(recortar(42, 10)).toBe('');
    expect(recortar({ a: 1 }, 10)).toBe('');
    expect(recortar(['x'], 10)).toBe('');
  });
});

describe('escaparHtml · el correo se envía como HTML', () => {
  it('neutraliza las etiquetas que escriba el visitante', () => {
    const inyeccion = '<script>alert(1)</script>';
    expect(escaparHtml(inyeccion)).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapa los cinco caracteres que rompen el HTML', () => {
    expect(escaparHtml(`& < > " '`)).toBe('&amp; &lt; &gt; &quot; &#39;');
  });

  it('no toca el texto normal, ni las tildes ni las eñes', () => {
    const normal = 'Mi hijo tiene 8 años y está pasando por una separación.';
    expect(escaparHtml(normal)).toBe(normal);
  });

  it('escapa el ampersand primero, sin dejar entidades a medias', () => {
    // Si se escapara al revés, "&lt;" se convertiría en "&amp;lt;" y
    // el correo mostraría el código en crudo en vez del símbolo.
    expect(escaparHtml('<')).toBe('&lt;');
    expect(escaparHtml('&lt;')).toBe('&amp;lt;');
  });
});

import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_LANGUAGE,
  LanguageService,
  resolveInitialLanguage,
  toTranslateCode,
} from './language.service';

const STORAGE_KEY = 'psyconova.language';

/**
 * El idioma es lo más fácil de romper sin que nada avise: un valor raro en
 * localStorage, un navegador en francés o un `<html lang>` que se queda en
 * español mientras la página está en inglés. Ningún caso da error en consola.
 */
describe('resolveInitialLanguage', () => {
  const navegadorEn = (idioma: string) =>
    vi.spyOn(navigator, 'language', 'get').mockReturnValue(idioma);

  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('la preferencia guardada manda sobre el idioma del navegador', () => {
    localStorage.setItem(STORAGE_KEY, 'EN');
    navegadorEn('es-CO');

    expect(resolveInitialLanguage()).toBe('EN');
  });

  it('sin preferencia, toma el idioma del navegador si el sitio lo tiene', () => {
    navegadorEn('en-GB');
    expect(resolveInitialLanguage()).toBe('EN');

    navegadorEn('es-MX');
    expect(resolveInitialLanguage()).toBe('ES');
  });

  it('un navegador en otro idioma cae en español', () => {
    navegadorEn('fr-FR');
    expect(resolveInitialLanguage()).toBe(DEFAULT_LANGUAGE);
  });

  it('un valor guardado que no es un idioma del sitio se ignora', () => {
    localStorage.setItem(STORAGE_KEY, 'FR');
    navegadorEn('en-US');

    expect(resolveInitialLanguage()).toBe('EN');
  });

  it('el código de archivo de traducción va en minúsculas', () => {
    expect(toTranslateCode('EN')).toBe('en');
    expect(toTranslateCode('ES')).toBe('es');
  });
});

describe('LanguageService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('es-CO');
    TestBed.configureTestingModule({
      providers: [provideTranslateService({ fallbackLang: 'es', lang: 'es' })],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.lang = '';
  });

  it('arranca en español cuando no hay nada guardado', () => {
    const servicio = TestBed.inject(LanguageService);
    expect(servicio.active()).toBe('ES');
  });

  it('en el navegador aplica la preferencia guardada nada más construirse', () => {
    localStorage.setItem(STORAGE_KEY, 'EN');
    const translate = TestBed.inject(TranslateService);
    const usar = vi.spyOn(translate, 'use');

    const servicio = TestBed.inject(LanguageService);

    expect(servicio.active()).toBe('EN');
    expect(usar).toHaveBeenCalledWith('en');
  });

  it('cambiar de idioma lo guarda para la próxima visita', () => {
    const servicio = TestBed.inject(LanguageService);

    servicio.use('EN');

    expect(servicio.active()).toBe('EN');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('EN');
  });

  it('mantiene <html lang> a la par del idioma activo', () => {
    const servicio = TestBed.inject(LanguageService);
    TestBed.tick();
    expect(document.documentElement.lang).toBe('es');

    servicio.use('EN');
    TestBed.tick();

    expect(document.documentElement.lang).toBe('en');
  });

  it('pedir el idioma que ya está activo no toca nada', () => {
    const servicio = TestBed.inject(LanguageService);
    const translate = TestBed.inject(TranslateService);
    const usar = vi.spyOn(translate, 'use');

    servicio.use('ES');

    expect(usar).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('sigue funcionando aunque el almacenamiento esté bloqueado', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    const servicio = TestBed.inject(LanguageService);

    expect(() => servicio.use('EN')).not.toThrow();
    expect(servicio.active()).toBe('EN');
  });
});

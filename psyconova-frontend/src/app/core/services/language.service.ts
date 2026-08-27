import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export const LANGUAGES = ['ES', 'EN'] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = 'psyconova.language';
const DEFAULT_LANGUAGE: Language = 'ES';

/** Código de archivo en assets/i18n/<code>.json */
export function toTranslateCode(language: Language): string {
  return language.toLowerCase();
}

/** Idioma inicial: preferencia guardada → idioma del navegador → español. */
export function resolveInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && LANGUAGES.includes(stored)) return stored;
  } catch {
    // localStorage puede no estar disponible (modo privado, cookies bloqueadas).
  }

  const browser = (navigator.language ?? '').slice(0, 2).toUpperCase() as Language;
  return LANGUAGES.includes(browser) ? browser : DEFAULT_LANGUAGE;
}

/**
 * Fuente única del idioma activo del sitio.
 *
 * El navbar y la portada comparten este servicio, de modo que cambiar el
 * idioma en cualquiera de los dos selectores se refleja en el otro.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly current = signal<Language>(resolveInitialLanguage());

  readonly languages = LANGUAGES;
  readonly active = this.current.asReadonly();

  constructor() {
    this.apply(this.current());
  }

  use(language: Language): void {
    if (language === this.current()) return;

    this.current.set(language);
    this.apply(language);

    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Sin persistencia el idioma sigue funcionando durante la sesión.
    }
  }

  private apply(language: Language): void {
    const code = toTranslateCode(language);
    this.translate.use(code);
    document.documentElement.lang = code;
  }
}

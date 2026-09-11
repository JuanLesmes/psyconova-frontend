import { DOCUMENT, Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

export const LANGUAGES = ['ES', 'EN'] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = 'psyconova.language';

/**
 * Español por defecto, y también el idioma con el que se prerenderiza.
 *
 * Al generar el HTML en la compilación no hay navegador ni preferencia
 * guardada, así que todas las páginas salen en español. Es lo correcto para
 * un sitio colombiano: es lo que verán los buscadores y lo que se lee al
 * compartir el enlace.
 */
export const DEFAULT_LANGUAGE: Language = 'ES';

/** Código de archivo en assets/i18n/<code>.json */
export function toTranslateCode(language: Language): string {
  return language.toLowerCase();
}

/**
 * Preferencia guardada → idioma del navegador → español.
 *
 * Sólo tiene sentido llamarla desde el navegador. Al prerenderizar no existe
 * ni `localStorage` ni `navigator`, y por eso el servicio la llama detrás de
 * una comprobación de plataforma en vez de al construirse.
 */
export function resolveInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && LANGUAGES.includes(stored)) return stored;
  } catch {
    // localStorage puede no estar disponible (modo privado, cookies bloqueadas).
  }

  try {
    const browser = (navigator.language ?? '').slice(0, 2).toUpperCase() as Language;
    return LANGUAGES.includes(browser) ? browser : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

/**
 * Fuente única del idioma activo del sitio.
 *
 * El navbar y la portada comparten este servicio, de modo que cambiar el
 * idioma en cualquiera de los dos selectores se refleja en el otro.
 *
 * ── Por qué NO lee la preferencia al construirse ──
 *
 * Con hidratación, lo primero que pinta el navegador tiene que coincidir
 * exactamente con el HTML prerenderizado, que siempre viene en español. Si
 * el servicio arrancara leyendo `localStorage`, alguien con el inglés
 * guardado vería el primer render en inglés sobre un HTML en español:
 * Angular detecta el desajuste, descarta lo prerenderizado y lo reconstruye
 * entero. Eso es exactamente el salto de maquetación que el prerenderizado
 * venía a evitar.
 *
 * Así que arranca en español —igual que el servidor— y cambia al idioma
 * guardado justo después, ya hidratado.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly current = signal<Language>(DEFAULT_LANGUAGE);

  readonly languages = LANGUAGES;
  readonly active = this.current.asReadonly();

  constructor() {
    // Mantiene el <html lang> a la par del idioma activo, en el navegador y
    // también al prerenderizar (ahí DOCUMENT sí existe, es el DOM del render).
    effect(() => {
      this.document.documentElement.lang = toTranslateCode(this.current());
    });

    if (this.esNavegador) {
      const preferido = resolveInitialLanguage();
      if (preferido !== DEFAULT_LANGUAGE) {
        this.use(preferido);
      }
    }
  }

  use(language: Language): void {
    if (language === this.current()) return;

    this.current.set(language);
    this.translate.use(toTranslateCode(language));

    if (!this.esNavegador) return;

    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Sin persistencia el idioma sigue funcionando durante la sesión.
    }
  }
}

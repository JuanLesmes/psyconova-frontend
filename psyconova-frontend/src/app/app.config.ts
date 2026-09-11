import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  provideClientHydration,
  withEventReplay,
  withIncrementalHydration,
} from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { DEFAULT_LANGUAGE, toTranslateCode } from './core/services/language.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'top',
      })
    ),
    // withFetch: al prerenderizar no hay XMLHttpRequest, y el cargador de
    // traducciones pide los JSON por HTTP también durante la generación.
    provideHttpClient(withFetch()),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: 'assets/i18n/',
        suffix: '.json',
      }),
      fallbackLang: 'es',
      /**
       * Siempre español al arrancar, no la preferencia guardada: la
       * configuración se construye también al prerenderizar, donde no hay
       * localStorage ni navigator. LanguageService cambia al idioma guardado
       * ya en el navegador, después de hidratar, para que el primer render
       * coincida con el HTML generado.
       */
      lang: toTranslateCode(DEFAULT_LANGUAGE),
    }),
    // La hidratación incremental permite `@defer (hydrate on ...)`: las
    // secciones de la portada se prerenderizan enteras y su JavaScript sólo
    // se carga cuando hacen falta.
    provideClientHydration(withEventReplay(), withIncrementalHydration()),
  ],
};

import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
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
       * Siempre español al arrancar, no la preferencia guardada.
       *
       * Antes esto llamaba a `resolveInitialLanguage()`, que lee localStorage
       * y navigator. Al construirse la configuración —no en un ciclo de vida—
       * eso reventaba el prerenderizado entero, que es el caso que más cuesta
       * de diagnosticar porque no señala ningún componente.
       *
       * LanguageService cambia al idioma guardado ya en el navegador, después
       * de hidratar, para que el primer render coincida con el HTML generado.
       */
      lang: toTranslateCode(DEFAULT_LANGUAGE),
    }),
    provideClientHydration(withEventReplay()),
  ],
};

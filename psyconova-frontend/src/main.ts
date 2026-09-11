import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// zone.js se importa desde la opción `polyfills` de angular.json y no aquí,
// para que entre también en el paquete del servidor: si sólo lo importara
// este archivo, el prerenderizado fallaría con NG0908.
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

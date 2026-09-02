import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// zone.js ya no se importa aquí: está en la opción `polyfills` de angular.json
// para que entre también en el paquete del servidor. Cuando sólo lo importaba
// este archivo, el prerenderizado fallaba con NG0908.
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

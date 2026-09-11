import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { Home } from './features/home/pages/home/home';

/**
 * El sitio es una sola página con anclas: el menú y el pie navegan con
 * `routerLink="/" fragment="..."`, no con rutas propias. Por eso aquí sólo
 * viven la portada, las dos páginas legales y la de error.
 *
 * La portada se importa directamente porque es lo primero que se pinta. Las
 * legales y el 404 se cargan bajo demanda: casi nadie las visita y así no
 * entran en el paquete inicial.
 *
 * El 404 aparece dos veces a propósito. `404` es una ruta concreta porque el
 * comodín no se puede enumerar y, por tanto, no se puede prerenderizar: de
 * esa ruta sale el archivo 404.html que Netlify sirve con código 404 real.
 * `**` pinta la misma página sin recargar para quien ya esté navegando por
 * el sitio y siga un enlace roto.
 */
export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: Home },
      {
        path: 'politica-de-privacidad',
        loadComponent: () =>
          import('./features/legal/pages/privacy-policy/privacy-policy').then(m => m.PrivacyPolicy),
      },
      {
        path: 'terminos-de-uso',
        loadComponent: () =>
          import('./features/legal/pages/terms-of-use/terms-of-use').then(m => m.TermsOfUse),
      },
      {
        path: '404',
        loadComponent: () => import('./features/not-found/not-found').then(m => m.NotFound),
      },
      {
        path: '**',
        loadComponent: () => import('./features/not-found/not-found').then(m => m.NotFound),
      },
    ],
  },
];

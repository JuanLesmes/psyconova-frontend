import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { Home } from './features/home/pages/home/home';
import { NotFound } from './features/not-found/not-found';
import { PrivacyPolicy } from './features/legal/pages/privacy-policy/privacy-policy';
import { TermsOfUse } from './features/legal/pages/terms-of-use/terms-of-use';

/**
 * El sitio es una sola página con anclas: el menú y el pie navegan con
 * `routerLink="/" fragment="..."`, no con rutas propias.
 *
 * Por eso aquí solo viven la portada, las dos páginas legales y la de error.
 * Las rutas /about, /services y /contact que traía la plantilla de Angular
 * servían `<p>about works!</p>` en producción y se eliminaron.
 *
 * ── Por qué el 404 aparece dos veces ──
 *
 * `404` es una ruta concreta porque el comodín no se puede enumerar y, por
 * tanto, no se puede prerenderizar. De esa ruta sale el archivo 404.html que
 * Netlify sirve con código 404 de verdad.
 *
 * `**` pinta la misma página sin recargar, para quien ya esté navegando por
 * el sitio y siga un enlace roto. Antes redirigía a la portada con código
 * 200, que para un buscador son infinitas páginas duplicadas de la portada.
 */
export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: Home },
      { path: 'politica-de-privacidad', component: PrivacyPolicy },
      { path: 'terminos-de-uso', component: TermsOfUse },
      { path: '404', component: NotFound },
      { path: '**', component: NotFound },
    ],
  },
];

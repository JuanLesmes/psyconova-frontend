import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { Home } from './features/home/pages/home/home';
import { PrivacyPolicy } from './features/legal/pages/privacy-policy/privacy-policy';
import { TermsOfUse } from './features/legal/pages/terms-of-use/terms-of-use';

/**
 * El sitio es una sola página con anclas: el menú y el pie navegan con
 * `routerLink="/" fragment="..."`, no con rutas propias.
 *
 * Por eso aquí solo viven la portada y las dos páginas legales. Las rutas
 * /about, /services y /contact que traía la plantilla de Angular servían
 * `<p>about works!</p>` en producción y se eliminaron.
 */
export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: Home },
      { path: 'politica-de-privacidad', component: PrivacyPolicy },
      { path: 'terminos-de-uso', component: TermsOfUse },
    ],
  },
  { path: '**', redirectTo: '' }
];

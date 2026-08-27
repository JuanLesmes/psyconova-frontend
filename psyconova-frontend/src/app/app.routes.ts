import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { Home } from './features/home/pages/home/home';
import { About } from './features/about/pages/about/about';
import { Services } from './features/services/pages/services/services';
import { Contact } from './features/contact/pages/contact/contact';
import { PrivacyPolicy } from './features/legal/pages/privacy-policy/privacy-policy';
import { TermsOfUse } from './features/legal/pages/terms-of-use/terms-of-use';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: Home },
      { path: 'about', component: About },
      { path: 'services', component: Services },
      { path: 'contact', component: Contact },
      { path: 'politica-de-privacidad', component: PrivacyPolicy },
      { path: 'terminos-de-uso', component: TermsOfUse },
    ],
  },
  { path: '**', redirectTo: '' }
];
import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { Home } from './features/home/pages/home/home';
import { About } from './features/about/pages/about/about';
import { Services } from './features/services/pages/services/services';
import { Contact } from './features/contact/pages/contact/contact';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: Home },
      { path: 'about', component: About },
      { path: 'services', component: Services },
      { path: 'contact', component: Contact },
    ],
  },
  { path: '**', redirectTo: '' }
];
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';

/**
 * Los textos viven en assets/i18n/<idioma>.json bajo `services.cards.<key>`.
 * Aquí sólo queda lo que no se traduce: numeración y color de acento.
 */
interface Service {
  num: string;
  key: string;
  accent: 'teal' | 'purple' | 'indigo';
}

// --- Desactivado temporalmente junto con la sección "Entornos VR" del template ---
// interface VrEnv {
//   num: string;
//   label: string;
//   img: string;
// }

@Component({
  selector: 'app-services-section',
  standalone: true,
  imports: [CommonModule, RevealDirective, TranslatePipe],
  templateUrl: './services-section.html',
  styleUrl: './services-section.scss',
})
export class ServicesSection {
  features: string[] = [
    'services.features.immersive',
    'services.features.disconnect',
    'services.features.intuitive',
    'services.features.anywhere',
  ];

  services: Service[] = [
    { num: '01', key: 'personal', accent: 'teal' },
    { num: '02', key: 'professional', accent: 'purple' },
    { num: '03', key: 'selfKnowledge', accent: 'indigo' },
  ];

  // --- Desactivado temporalmente: ver bloque "Entornos VR" comentado en services-section.html ---
  // Al reactivarlo, mover los `label` a assets/i18n/*.json bajo `services.environments`.
  // environments: VrEnv[] = [
  //     { num: '01', label: 'Costa y playa', img: '' },
  //     { num: '02', label: 'Mundo submarino', img: '' },
  //     { num: '03', label: 'Bosque y naturaleza', img: '' },
  //     { num: '04', label: 'Paisaje montañoso', img: '' },
  // ];
}

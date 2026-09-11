
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

@Component({
  selector: 'app-services-section',
  imports: [RevealDirective, TranslatePipe],
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
}

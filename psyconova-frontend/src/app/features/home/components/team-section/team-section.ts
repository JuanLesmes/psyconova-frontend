
import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';

/**
 * Los textos viven en assets/i18n/<idioma>.json bajo `team.lead`.
 * Aquí sólo queda lo que no se traduce: la foto y las claves de especialidad.
 */
interface Lead {
  photo: string;
  /** Claves de traducción de las especialidades. */
  specialties: string[];
}

@Component({
  selector: 'app-team-section',
  imports: [RevealDirective, TranslatePipe],
  templateUrl: './team-section.html',
  styleUrl: './team-section.scss',
})
export class TeamSection {
  lead: Lead = {
    // Generada por `npm run optimize:images` desde design/source-images/team/
    photo: 'assets/images/team/laura.webp',
    specialties: [
      'team.lead.specialties.cbt',
      'team.lead.specialties.act',
      'team.lead.specialties.dbt',
      'team.lead.specialties.vr',
      'team.lead.specialties.regulation',
      'team.lead.specialties.mindfulness',
      'team.lead.specialties.cyberpsychology',
    ],
  };
}

import { CommonModule } from '@angular/common';
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

// --- Oculto temporalmente junto con el bloque "Equipo interdisciplinario" del template ---
// interface TeamMember {
//   key: string;
//   photo: string;
//   accent: 'teal' | 'purple' | 'indigo';
// }

@Component({
  selector: 'app-team-section',
  standalone: true,
  imports: [CommonModule, RevealDirective, TranslatePipe],
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

  // --- Oculto temporalmente: ver bloque "Equipo interdisciplinario" comentado en team-section.html ---
  // Los textos de cada integrante siguen en assets/i18n/*.json bajo `team.members`.
  // team: TeamMember[] = [
  //   { key: 'tech', photo: '', accent: 'teal' },
  //   { key: 'legal', photo: '', accent: 'purple' },
  //   { key: 'marketing', photo: '', accent: 'indigo' },
  // ];
}

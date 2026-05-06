import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';

interface TeamMember {
  name: string;
  role: string;
  area: string;
  bio: string;
  photo: string;
  accent: 'teal' | 'purple' | 'indigo';
}

interface Lead {
  name: string;
  role: string;
  credentials: string;
  bio: string;
  photo: string;
  specialties: string[];
}

@Component({
  selector: 'app-team-section',
  standalone: true,
  imports: [CommonModule, RevealDirective],
  templateUrl: './team-section.html',
  styleUrl: './team-section.scss',
})
export class TeamSection {
  lead: Lead = {
    name: 'Nombre de la Psicóloga',
    role: 'Fundadora & Directora Clínica',
    credentials: 'Psicóloga Clínica · Esp. en Ciberpsicología',
    bio: 'Con formación en psicología clínica y una especialización en el uso de tecnología aplicada al bienestar emocional, lidera el desarrollo científico y terapéutico de PSYCONOVA. Su trayectoria combina la práctica clínica tradicional con la investigación en realidad virtual como herramienta de intervención, construyendo un puente entre la psicología moderna y la innovación tecnológica con un enfoque profundamente humano.',
    photo: '',
    specialties: [
      'Terapia Cognitivo-Conductual',
      'Realidad Virtual Terapéutica',
      'Regulación Emocional',
      'Ciberpsicología',
    ],
  };

  team: TeamMember[] = [
    {
      name: 'Nombre del Líder',
      role: 'Líder de Tecnología',
      area: 'Tecnología',
      bio: 'Responsable de la arquitectura técnica, el desarrollo de los entornos VR y la integración de la plataforma con los protocolos clínicos.',
      photo: '',
      accent: 'teal',
    },
    {
      name: 'Nombre del Asesor',
      role: 'Asesor Legal',
      area: 'Legal',
      bio: 'Garantiza el cumplimiento normativo en protección de datos, privacidad clínica y el marco legal para el uso de tecnología en salud mental.',
      photo: '',
      accent: 'purple',
    },
    {
      name: 'Nombre del Estratega',
      role: 'Estratega de Marketing',
      area: 'Marketing',
      bio: 'Define la voz de marca, la estrategia de comunicación y los canales para conectar a PSYCONOVA con las personas que más lo necesitan.',
      photo: '',
      accent: 'indigo',
    },
  ];
}

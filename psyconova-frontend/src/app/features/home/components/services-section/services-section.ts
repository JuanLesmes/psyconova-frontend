import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';

interface Service {
  num: string;
  label: string;
  title: string;
  desc: string;
  accent: 'teal' | 'purple' | 'indigo';
}

interface VrEnv {
  num: string;
  label: string;
  img: string;
}

@Component({
  selector: 'app-services-section',
  standalone: true,
  imports: [CommonModule, RevealDirective],
  templateUrl: './services-section.html',
  styleUrl: './services-section.scss',
})
export class ServicesSection {
  features: string[] = [
    'Experiencias inmersivas de relajación y regulación emocional en el tiempo que el usuario decida.',
    'Desconectarse del entorno laboral sin desplazarse ni interrumpir la rutina.',
    'Sin conocimiento previo: la tecnología guía la experiencia de forma intuitiva.',
    'En oficina, casa o cualquier lugar privado, programando la sesión según disponibilidad.',
  ];

  services: Service[] = [
    {
      num: '01',
      label: 'Bienestar personal',
      title: 'Ambientes de relajación para el manejo del estrés cotidiano',
      desc: 'Entornos inmersivos diseñados para reducir el estrés, promover la calma y restaurar el equilibrio emocional en el día a día.',
      accent: 'teal',
    },
    {
      num: '02',
      label: 'Uso profesional',
      title: 'Herramienta para explorar la identidad y conflictos',
      desc: 'Para psicólogos y profesionales de la salud mental: evaluación e intervención apoyada en realidad virtual para acompañar procesos terapéuticos.',
      accent: 'purple',
    },
    {
      num: '03',
      label: 'Autoconocimiento',
      title: 'Exploración de sí mismos',
      desc: 'Espacios de introspección donde cada persona conecta con sus emociones y expande su comprensión interna a través de entornos guiados.',
      accent: 'indigo',
    },
  ];

  environments: VrEnv[] = [
    { num: '01', label: 'Costa y playa', img: '' },
    { num: '02', label: 'Mundo submarino', img: '' },
    { num: '03', label: 'Bosque y naturaleza', img: '' },
    { num: '04', label: 'Paisaje montañoso', img: '' },
  ];
}

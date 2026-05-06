import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';

interface IntroNode {
  id: string;
  tag: string;
  title: string;
  detail: string;
  image: string;
  alt: string;
  x: number;
  y: number;
  lineX: number;
  lineY: number;
}

interface LoopImage {
  image: string;
  alt: string;
}

@Component({
  selector: 'app-intro-section',
  standalone: true,
  imports: [CommonModule, RevealDirective],
  templateUrl: './intro-section.html',
  styleUrl: './intro-section.scss'
})
export class IntroSection implements OnInit, OnDestroy {
  title = 'Una experiencia inmersiva para acercar el bienestar emocional a la vida cotidiana';

  description =
    'PSYCONOVA integra psicología, tecnología y ciencia para crear experiencias innovadoras en salud mental. Su propuesta combina realidad virtual, ciberpsicología y un enfoque humano para ofrecer una forma más accesible, intuitiva y significativa de cuidar el bienestar emocional.';

  activeId: string | null = null;

  private loopIntervalId?: number;
  private cleanupTimeoutId?: number;
  private clearDelayId?: number;

  loopImages: LoopImage[] = [
    {
      image: 'assets/images/intro-story/01-poniendo-gafas.png',
      alt: 'Persona iniciando una experiencia inmersiva'
    },
    {
      image: 'assets/images/intro-story/02-gafas-puestas.png',
      alt: 'Persona usando gafas de realidad virtual'
    },
    {
      image: 'assets/images/intro-story/03-transformacion.png',
      alt: 'Escena de transformación inmersiva'
    }
  ];

  currentLoopIndex = 0;
  previousLoopIndex: number | null = null;

  // lineX/lineY = SVG coordinates (viewBox 0 0 1000 760)
  // Mapped from node.x/y via: lineX = x*10, lineY = y*7.6
  nodes: IntroNode[] = [
    {
      id: 'problema',
      tag: 'Problema',
      title: 'Estrés y barreras reales',
      detail:
        'Muchas personas viven con estrés constante, poco tiempo y dificultades para acceder a apoyos tradicionales de salud mental.',
      image: 'assets/images/intro-story/09-desierto.png',
      alt: 'Escena de desierto como metáfora de desgaste y barreras emocionales',
      x: 23,
      y: 21,
      lineX: 230,
      lineY: 160
    },
    {
      id: 'que-es',
      tag: 'Qué es',
      title: 'Psicología + tecnología + ciencia',
      detail:
        'PSYCONOVA es una plataforma de innovación en salud mental que conecta conocimiento psicológico, tecnología y ciencia aplicada.',
      image: 'assets/images/intro-story/04-espacio.png',
      alt: 'Escena espacial como metáfora de exploración e innovación',
      x: 50,
      y: 10,
      lineX: 502,
      lineY: 76
    },
    {
      id: 'tecnologia',
      tag: 'Tecnología',
      title: 'Realidad virtual y ciberpsicología',
      detail:
        'La propuesta utiliza experiencias inmersivas para acompañar procesos de bienestar emocional desde una mirada innovadora y ética.',
      image: 'assets/images/intro-story/06-volcan.png',
      alt: 'Escena de volcán como metáfora de energía e intensidad tecnológica',
      x: 77,
      y: 21,
      lineX: 770,
      lineY: 160
    },
    {
      id: 'exploracion',
      tag: 'Exploración',
      title: 'Autoconocimiento y nuevas posibilidades',
      detail:
        'Además del alivio emocional, la experiencia abre espacio para explorar la identidad, el asombro y nuevas formas de comprenderse.',
      image: 'assets/images/intro-story/10-biblioteca.png',
      alt: 'Escena de biblioteca como metáfora de exploración y autoconocimiento',
      x: 13,
      y: 50,
      lineX: 130,
      lineY: 383
    },
    {
      id: 'acceso',
      tag: 'Acceso',
      title: 'Más simple, más intuitivo',
      detail:
        'La experiencia está pensada para ser fácil de vivir, sin requerir conocimientos previos y sin romper por completo la rutina cotidiana.',
      image: 'assets/images/intro-story/05-mar.png',
      alt: 'Escena del mar como metáfora de accesibilidad y apertura',
      x: 87,
      y: 50,
      lineX: 870,
      lineY: 383
    },
    {
      id: 'impacto',
      tag: 'Impacto',
      title: 'Democratizar el bienestar mental',
      detail:
        'Busca acercar herramientas avanzadas de bienestar emocional a más personas, contextos y formas de vida.',
      image: 'assets/images/intro-story/07-elefante.png',
      alt: 'Escena con elefante como metáfora de impacto y fuerza',
      x: 26,
      y: 83,
      lineX: 260,
      lineY: 631
    },
    {
      id: 'bienestar',
      tag: 'Bienestar',
      title: 'Relajación y regulación emocional',
      detail:
        'Ayuda a desconectarse del ruido cotidiano y reconectar con un estado más calmado, consciente y emocionalmente regulado.',
      image: 'assets/images/intro-story/08-bosque.png',
      alt: 'Escena de bosque como metáfora de calma y regulación emocional',
      x: 74,
      y: 83,
      lineX: 740,
      lineY: 631
    }
  ];

  ngOnInit(): void {
    this.startImageLoop();
  }

  ngOnDestroy(): void {
    this.stopImageLoop();

    if (this.cleanupTimeoutId) window.clearTimeout(this.cleanupTimeoutId);
    if (this.clearDelayId) window.clearTimeout(this.clearDelayId);
  }

  get activeNode(): IntroNode | null {
    if (!this.activeId) return null;
    return this.nodes.find(node => node.id === this.activeId) ?? null;
  }

  get currentLoopImage(): LoopImage {
    return this.loopImages[this.currentLoopIndex];
  }

  get previousLoopImage(): LoopImage | null {
    if (this.previousLoopIndex === null) return null;
    return this.loopImages[this.previousLoopIndex] ?? null;
  }

  get displayImage(): string {
    return this.activeNode ? this.activeNode.image : this.currentLoopImage.image;
  }

  get displayAlt(): string {
    return this.activeNode ? this.activeNode.alt : this.currentLoopImage.alt;
  }

  setActive(id: string): void {
    if (this.clearDelayId) {
      window.clearTimeout(this.clearDelayId);
      this.clearDelayId = undefined;
    }
    this.activeId = id;
  }

  clearActiveDelayed(): void {
    this.clearDelayId = window.setTimeout(() => {
      this.activeId = null;
      this.clearDelayId = undefined;
    }, 110);
  }

  clearActive(): void {
    if (this.clearDelayId) {
      window.clearTimeout(this.clearDelayId);
      this.clearDelayId = undefined;
    }
    this.activeId = null;
  }

  private startImageLoop(): void {
    if (this.loopIntervalId) return;

    this.loopIntervalId = window.setInterval(() => {
      if (this.activeId) return;

      this.previousLoopIndex = this.currentLoopIndex;
      this.currentLoopIndex = (this.currentLoopIndex + 1) % this.loopImages.length;

      if (this.cleanupTimeoutId) window.clearTimeout(this.cleanupTimeoutId);

      this.cleanupTimeoutId = window.setTimeout(() => {
        this.previousLoopIndex = null;
      }, 980);
    }, 3200);
  }

  private stopImageLoop(): void {
    if (!this.loopIntervalId) return;
    window.clearInterval(this.loopIntervalId);
    this.loopIntervalId = undefined;
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';

/**
 * Los textos viven en assets/i18n/<idioma>.json bajo `intro.nodes.<id>`.
 * Aquí sólo queda la geometría y las imágenes, que no se traducen.
 */
interface IntroNode {
  id: string;
  image: string;
  x: number;
  y: number;
  lineX: number;
  lineY: number;
}

interface LoopImage {
  image: string;
  altKey: string;
}

@Component({
  selector: 'app-intro-section',
  standalone: true,
  imports: [CommonModule, RevealDirective, TranslatePipe],
  templateUrl: './intro-section.html',
  styleUrl: './intro-section.scss'
})
export class IntroSection implements OnInit, OnDestroy {
  activeId: string | null = null;

  private loopIntervalId?: number;
  private cleanupTimeoutId?: number;
  private clearDelayId?: number;

  loopImages: LoopImage[] = [
    {
      image: 'assets/images/intro-story/01-poniendo-gafas.webp',
      altKey: 'intro.loop.start'
    },
    {
      image: 'assets/images/intro-story/02-gafas-puestas.webp',
      altKey: 'intro.loop.wearing'
    },
    {
      image: 'assets/images/intro-story/03-transformacion.webp',
      altKey: 'intro.loop.transformation'
    }
  ];

  currentLoopIndex = 0;
  previousLoopIndex: number | null = null;

  // lineX/lineY = SVG coordinates (viewBox 0 0 1000 760)
  // Mapped from node.x/y via: lineX = x*10, lineY = y*7.6
  nodes: IntroNode[] = [
    {
      id: 'problema',
      image: 'assets/images/intro-story/09-desierto.webp',
      x: 23,
      y: 21,
      lineX: 230,
      lineY: 160
    },
    {
      id: 'que-es',
      image: 'assets/images/intro-story/04-espacio.webp',
      x: 50,
      y: 10,
      lineX: 502,
      lineY: 76
    },
    {
      id: 'tecnologia',
      image: 'assets/images/intro-story/06-volcan.webp',
      x: 77,
      y: 21,
      lineX: 770,
      lineY: 160
    },
    {
      id: 'exploracion',
      image: 'assets/images/intro-story/10-biblioteca.webp',
      x: 13,
      y: 50,
      lineX: 130,
      lineY: 383
    },
    {
      id: 'acceso',
      image: 'assets/images/intro-story/05-mar.webp',
      x: 87,
      y: 50,
      lineX: 870,
      lineY: 383
    },
    {
      id: 'impacto',
      image: 'assets/images/intro-story/07-elefante.webp',
      x: 26,
      y: 83,
      lineX: 260,
      lineY: 631
    },
    {
      id: 'bienestar',
      image: 'assets/images/intro-story/08-bosque.webp',
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

  get displayAltKey(): string {
    return this.activeNode
      ? `intro.nodes.${this.activeNode.id}.alt`
      : this.currentLoopImage.altKey;
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

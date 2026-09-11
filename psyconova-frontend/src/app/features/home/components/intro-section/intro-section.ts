import { isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { RevealDirective, prefiereMenosMovimiento } from '../../../../shared/directives/reveal.directive';

/**
 * Los textos viven en assets/i18n/<idioma>.json bajo `intro.nodes.<id>`.
 * Aquí sólo queda la geometría y las imágenes, que no se traducen.
 *
 * `x`/`y` posicionan el botón en porcentaje del escenario. `lineX`/`lineY`
 * son el mismo punto en coordenadas del SVG (viewBox 0 0 1000 760):
 * lineX = x * 10, lineY = y * 7,6.
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

/** Imágenes que rotan en el centro mientras nadie señala un nodo. */
const LOOP_IMAGES: LoopImage[] = [
  { image: 'assets/images/intro-story/01-poniendo-gafas.webp', altKey: 'intro.loop.start' },
  { image: 'assets/images/intro-story/02-gafas-puestas.webp', altKey: 'intro.loop.wearing' },
  { image: 'assets/images/intro-story/03-transformacion.webp', altKey: 'intro.loop.transformation' },
];

const NODES: IntroNode[] = [
  { id: 'problema', image: 'assets/images/intro-story/09-desierto.webp', x: 23, y: 21, lineX: 230, lineY: 160 },
  { id: 'que-es', image: 'assets/images/intro-story/04-espacio.webp', x: 50, y: 10, lineX: 502, lineY: 76 },
  { id: 'tecnologia', image: 'assets/images/intro-story/06-volcan.webp', x: 77, y: 21, lineX: 770, lineY: 160 },
  { id: 'exploracion', image: 'assets/images/intro-story/10-biblioteca.webp', x: 13, y: 50, lineX: 130, lineY: 383 },
  { id: 'acceso', image: 'assets/images/intro-story/05-mar.webp', x: 87, y: 50, lineX: 870, lineY: 383 },
  { id: 'impacto', image: 'assets/images/intro-story/07-elefante.webp', x: 26, y: 83, lineX: 260, lineY: 631 },
  { id: 'bienestar', image: 'assets/images/intro-story/08-bosque.webp', x: 74, y: 83, lineX: 740, lineY: 631 },
];

/** Cada cuánto cambia la imagen del centro. */
const LOOP_INTERVAL_MS = 3200;
/** Cuánto se mantiene la imagen anterior mientras se desvanece. */
const LOOP_FADE_MS = 980;
/** Margen para pasar de un nodo a otro sin que el centro parpadee. */
const CLEAR_DELAY_MS = 110;

/**
 * Sección «Nosotros»: una constelación de nodos alrededor de una imagen
 * central. Al señalar un nodo se ilumina su conexión y el centro muestra su
 * imagen; sin nodo señalado, el centro rota entre tres imágenes.
 */
@Component({
  selector: 'app-intro-section',
  imports: [RevealDirective, TranslatePipe],
  templateUrl: './intro-section.html',
  styleUrl: './intro-section.scss',
})
export class IntroSection implements OnInit, OnDestroy {
  /**
   * El carrusel usa `window.setInterval`, que no existe al prerenderizar. El
   * HTML generado sale con la primera imagen del ciclo, que es con la que
   * arranca el navegador, así que no hay desajuste al hidratar.
   */
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  readonly nodes = NODES;

  readonly activeId = signal<string | null>(null);
  readonly currentLoopIndex = signal(0);
  readonly previousLoopIndex = signal<number | null>(null);

  readonly activeNode = computed(() => {
    const id = this.activeId();
    return id ? (this.nodes.find(node => node.id === id) ?? null) : null;
  });

  readonly currentLoopImage = computed(() => LOOP_IMAGES[this.currentLoopIndex()]);

  readonly previousLoopImage = computed(() => {
    const index = this.previousLoopIndex();
    return index === null ? null : (LOOP_IMAGES[index] ?? null);
  });

  private loopIntervalId?: number;
  private cleanupTimeoutId?: number;
  private clearDelayId?: number;

  ngOnInit(): void {
    // Con movimiento reducido el centro se queda quieto en la primera imagen.
    if (!this.esNavegador || prefiereMenosMovimiento()) return;
    this.startImageLoop();
  }

  ngOnDestroy(): void {
    if (!this.esNavegador) return;

    this.stopImageLoop();

    if (this.cleanupTimeoutId) window.clearTimeout(this.cleanupTimeoutId);
    if (this.clearDelayId) window.clearTimeout(this.clearDelayId);
  }

  setActive(id: string): void {
    if (this.clearDelayId) {
      window.clearTimeout(this.clearDelayId);
      this.clearDelayId = undefined;
    }
    this.activeId.set(id);
  }

  clearActiveDelayed(): void {
    this.clearDelayId = window.setTimeout(() => {
      this.activeId.set(null);
      this.clearDelayId = undefined;
    }, CLEAR_DELAY_MS);
  }

  clearActive(): void {
    if (this.clearDelayId) {
      window.clearTimeout(this.clearDelayId);
      this.clearDelayId = undefined;
    }
    this.activeId.set(null);
  }

  private startImageLoop(): void {
    if (this.loopIntervalId) return;

    this.loopIntervalId = window.setInterval(() => {
      if (this.activeId()) return;

      this.previousLoopIndex.set(this.currentLoopIndex());
      this.currentLoopIndex.update(index => (index + 1) % LOOP_IMAGES.length);

      if (this.cleanupTimeoutId) window.clearTimeout(this.cleanupTimeoutId);

      this.cleanupTimeoutId = window.setTimeout(() => {
        this.previousLoopIndex.set(null);
      }, LOOP_FADE_MS);
    }, LOOP_INTERVAL_MS);
  }

  private stopImageLoop(): void {
    if (!this.loopIntervalId) return;
    window.clearInterval(this.loopIntervalId);
    this.loopIntervalId = undefined;
  }
}

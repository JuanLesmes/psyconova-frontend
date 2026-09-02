import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  inject,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

/**
 * Encierra el foco dentro de un panel mientras está abierto.
 *
 * ── Por qué esto no es opcional ──
 *
 * Poner `role="dialog"` y `aria-modal="true"` en un elemento es una promesa:
 * quien usa lector de pantalla entiende que lo de detrás no existe mientras
 * esto esté abierto. Si no se cumple, es peor que no haberlo declarado.
 *
 * Sin encierro del foco, alguien que navega con teclado abre el menú y sigue
 * tabulando hacia la página de debajo — que no puede ver, porque el menú la
 * tapa. El foco desaparece de la pantalla y no hay forma de saber dónde está.
 *
 * La directiva cumple las tres partes de la promesa:
 *
 *   1. Al abrir, el foco entra en el panel.
 *   2. Mientras está abierto, Tab y Mayús+Tab dan la vuelta dentro.
 *   3. Al cerrar, el foco vuelve al elemento que lo abrió.
 *
 * Escape cierra, que es lo que espera cualquiera que haya usado un diálogo.
 */
@Directive({
  selector: '[focusTrap]',
  standalone: true,
  host: {
    '(keydown)': 'onKeydown($event)',
  },
})
export class FocusTrapDirective implements OnChanges {
  /** El panel está abierto. */
  @Input({ required: true }) focusTrap = false;

  /**
   * Se emite al pulsar Escape, para que el componente cierre.
   *
   * Es una salida y no una función de entrada porque Angular prohíbe enlazar
   * propiedades que empiecen por `on`: las confunde con manejadores de evento
   * del DOM, que serían una vía de inyección.
   */
  @Output() escape = new EventEmitter<void>();

  // Anotado a mano: `inject(ElementRef<HTMLElement>)` deja `nativeElement`
  // sin tipo, y entonces querySelectorAll no acepta el argumento genérico.
  private readonly el: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  /** Quién tenía el foco antes de abrir, para devolvérselo al cerrar. */
  private origen: HTMLElement | null = null;

  ngOnChanges(cambios: SimpleChanges): void {
    if (!this.esNavegador || !cambios['focusTrap']) return;

    if (this.focusTrap) {
      this.origen = this.document.activeElement as HTMLElement | null;
      // El panel se muestra con una transición de visibility: enfocar antes
      // de que termine no funciona, porque aún no es visible.
      setTimeout(() => this.enfocables()[0]?.focus(), 60);
      return;
    }

    // Sólo se devuelve el foco si sigue dentro del panel. Si el usuario ya lo
    // movió a otra parte, arrastrarlo de vuelta sería peor que no hacer nada.
    if (this.origen && this.el.nativeElement.contains(this.document.activeElement)) {
      this.origen.focus();
    }
    this.origen = null;
  }

  onKeydown(evento: KeyboardEvent): void {
    if (!this.focusTrap) return;

    if (evento.key === 'Escape') {
      evento.preventDefault();
      this.escape.emit();
      return;
    }

    if (evento.key !== 'Tab') return;

    const elementos = this.enfocables();
    if (elementos.length === 0) return;

    const primero = elementos[0];
    const ultimo = elementos[elementos.length - 1];
    const actual = this.document.activeElement;

    // Dar la vuelta en los extremos: es lo que impide salirse del panel.
    if (evento.shiftKey && actual === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && actual === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }

  /**
   * Lo que puede recibir el foco dentro del panel, en orden de tabulación.
   *
   * Se recalcula en cada pulsación en vez de guardarse: el contenido puede
   * cambiar mientras el panel está abierto, y una lista vieja mandaría el
   * foco a un elemento que ya no existe.
   */
  private enfocables(): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    /**
     * Se descartan los que estén ocultos por CSS.
     *
     * La comprobación va por `getComputedStyle` y no por `offsetParent`, que
     * sería lo habitual: `offsetParent` depende de que el navegador haya
     * calculado la maquetación, y el entorno de pruebas no la calcula. Con
     * él, la lista salía vacía en las pruebas mientras funcionaba en un
     * navegador real — la peor combinación posible, porque las pruebas no
     * habrían detectado nunca una rotura.
     */
    const oculto = (e: HTMLElement) => {
      const cs = getComputedStyle(e);
      return cs.visibility === 'hidden' || cs.display === 'none' || e.hasAttribute('hidden');
    };

    return Array.from(this.el.nativeElement.querySelectorAll<HTMLElement>(selector)).filter(
      e => !oculto(e)
    );
  }
}

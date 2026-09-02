import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Hace aparecer el elemento cuando entra en pantalla.
 *
 * ── Por qué comprueba la plataforma antes de tocar nada ──
 *
 * La clase `reveal` aplica `opacity: 0`, y el elemento sólo se vuelve visible
 * cuando el IntersectionObserver lo detecta en pantalla. Al prerenderizar no
 * hay pantalla ni observador: si la clase se añadiera durante la generación
 * del HTML, las 53 secciones que usan esta directiva quedarían horneadas con
 * opacidad cero.
 *
 * El resultado sería un HTML donde el sitio entero está invisible — justo lo
 * contrario de lo que se busca al prerenderizar, y sin ningún error que lo
 * delate. Por eso en el servidor la directiva no hace absolutamente nada y el
 * contenido sale visible; ya en el navegador, se aplica la animación.
 */
@Directive({
  selector: '[reveal]',
  standalone: true,
})
export class RevealDirective implements OnInit, OnDestroy {
  @Input() revealType: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade' = 'up';
  @Input() revealDelay = 0;
  @Input() revealThreshold = 0.12;

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  private observer?: IntersectionObserver;

  ngOnInit(): void {
    if (!this.esNavegador) return;

    const el = this.el.nativeElement as HTMLElement;
    el.classList.add('reveal', `reveal--${this.revealType}`);
    if (this.revealDelay) el.style.transitionDelay = `${this.revealDelay}ms`;

    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            el.classList.add('is-visible');
            this.observer?.unobserve(el);
          }
        });
      },
      { threshold: this.revealThreshold, rootMargin: '0px 0px -50px 0px' }
    );

    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

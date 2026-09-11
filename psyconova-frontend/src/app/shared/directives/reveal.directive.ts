import { Directive, ElementRef, OnDestroy, OnInit, PLATFORM_ID, inject, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type RevealType = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';

/**
 * Hace aparecer el elemento cuando entra en pantalla.
 *
 * La clase `reveal` aplica `opacity: 0`, y el elemento sólo se vuelve visible
 * cuando el IntersectionObserver lo detecta en pantalla. Al prerenderizar no
 * hay pantalla ni observador, así que en el servidor la directiva no hace
 * nada y el contenido sale visible en el HTML generado. Si añadiera la clase
 * durante la generación, cada sección quedaría horneada con opacidad cero y
 * el sitio entero saldría invisible, sin ningún error que lo delatara.
 *
 * Con `prefers-reduced-motion` tampoco hace nada: el contenido se muestra
 * directamente, sin desplazamiento ni desvanecido.
 */
@Directive({
  selector: '[appReveal]',
})
export class RevealDirective implements OnInit, OnDestroy {
  readonly revealType = input<RevealType>('up');
  readonly revealDelay = input(0);
  readonly revealThreshold = input(0.12);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  private observer?: IntersectionObserver;

  ngOnInit(): void {
    if (!this.esNavegador || prefiereMenosMovimiento()) return;

    const el = this.el.nativeElement as HTMLElement;
    el.classList.add('reveal', `reveal--${this.revealType()}`);
    if (this.revealDelay()) el.style.transitionDelay = `${this.revealDelay()}ms`;

    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            el.classList.add('is-visible');
            this.observer?.unobserve(el);
          }
        });
      },
      { threshold: this.revealThreshold(), rootMargin: '0px 0px -50px 0px' }
    );

    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

/** Preferencia del sistema de reducir el movimiento. Sólo tiene sentido en el navegador. */
export function prefiereMenosMovimiento(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

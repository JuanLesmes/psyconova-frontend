import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-loading-screen',
  imports: [TranslatePipe],
  templateUrl: './loading-screen.html',
  styleUrl: './loading-screen.scss',
})
export class LoadingScreen implements OnInit, OnDestroy {
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  visible = true;
  hiding = false;

  private hideTimer?: ReturnType<typeof setTimeout>;
  private removeTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    /**
     * Los temporizadores sólo corren en el navegador. Al prerenderizar, Angular
     * espera a que la aplicación quede en reposo y sólo entonces escribe el
     * HTML: esta espera se sumaría a cada página generada sin aportar nada,
     * porque la animación es cosa del navegador. `visible` arranca en true en
     * los dos lados, así que lo prerenderizado y el primer pintado coinciden.
     */
    if (!this.esNavegador) return;

    this.hideTimer = setTimeout(() => {
      this.hiding = true;
      this.removeTimer = setTimeout(() => {
        this.visible = false;
      }, LoadingScreen.SALIDA_MS);
    }, LoadingScreen.ESPERA_MS);
  }

  /**
   * Cuánto se queda la pantalla hasta que empieza a irse. 900 ms, elegidos con
   * mediciones de Lighthouse en móvil: como el sitio se prerenderiza, la
   * pantalla tapa contenido ya escrito, y cada segundo de más baja la nota de
   * rendimiento y sube el Speed Index. Deja ver el logo sin bloquear la lectura.
   */
  private static readonly ESPERA_MS = 900;

  /** Debe coincidir con la transición de .ls en loading-screen.scss. */
  private static readonly SALIDA_MS = 400;

  ngOnDestroy(): void {
    clearTimeout(this.hideTimer);
    clearTimeout(this.removeTimer);
  }
}

import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
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
     * Los temporizadores sólo corren en el navegador.
     *
     * Al prerenderizar, Angular espera a que la aplicación quede en reposo
     * antes de escribir el HTML. Estos tres segundos de espera se sumarían a
     * cada página generada sin aportar nada, porque el HTML se escribe una
     * sola vez y la animación es cosa del navegador.
     *
     * `visible` arranca en true en los dos lados, así que lo prerenderizado y
     * lo primero que pinta el navegador coinciden: sin desajuste al hidratar.
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
   * Cuánto se queda la pantalla antes de empezar a irse.
   *
   * Eran 2400 ms. Se midieron con Lighthouse y costaban 18 puntos de
   * rendimiento en móvil: 79 con la pantalla, 97 sin ella. El Speed Index
   * pasaba de 2,3 s a 5,4 s.
   *
   * El motivo de fondo es que el sitio se prerenderiza: el contenido ya está
   * escrito cuando llega el visitante. La pantalla antes tapaba una página en
   * blanco; ahora taparía el sitio terminado.
   *
   * 900 ms deja ver el logo y la animación sin bloquear la lectura. Si se
   * vuelve a subir, hay que contar con que la nota baja en la misma medida.
   */
  private static readonly ESPERA_MS = 900;

  /** Debe coincidir con la transición de .ls en loading-screen.scss. */
  private static readonly SALIDA_MS = 400;

  ngOnDestroy(): void {
    clearTimeout(this.hideTimer);
    clearTimeout(this.removeTimer);
  }
}

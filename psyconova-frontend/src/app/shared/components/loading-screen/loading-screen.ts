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
      }, 700);
    }, 2400);
  }

  ngOnDestroy(): void {
    clearTimeout(this.hideTimer);
    clearTimeout(this.removeTimer);
  }
}

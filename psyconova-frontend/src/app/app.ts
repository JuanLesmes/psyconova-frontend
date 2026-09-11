import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoadingScreen } from './shared/components/loading-screen/loading-screen';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoadingScreen],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  ngOnInit(): void {
    // `history` y `window` no existen al prerenderizar: sin esta guarda, la
    // generación del HTML falla sin llegar a escribir una sola página.
    if (!this.esNavegador) return;

    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }
}

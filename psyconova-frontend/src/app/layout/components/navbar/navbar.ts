import { isPlatformBrowser } from '@angular/common';
import { Component, HostListener, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { MenuBar } from '../../../shared/components/menu-bar/menu-bar';
import { MenuOverlay } from '../../../shared/components/menu-overlay/menu-overlay';

/**
 * Barra fija que aparece al salir del hero.
 *
 * Sobre el hero se oculta, porque la portada ya trae su propia barra
 * (`HeroSection`). Más abajo aparece al desplazarse hacia arriba y se esconde
 * al bajar. En las páginas sin hero, las legales y el 404, es la única
 * navegación y se muestra siempre.
 */
@Component({
  selector: 'app-navbar',
  imports: [MenuBar, MenuOverlay],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit {
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  readonly menuOpen = signal(false);
  readonly visible = signal(false);

  private lastScrollY = 0;

  /**
   * La visibilidad se calcula también al arrancar, no sólo al desplazarse.
   * En una página sin hero nadie dispara el manejador de scroll hasta que el
   * visitante se mueve, y la barra quedaría invisible al entrar.
   */
  ngOnInit(): void {
    if (!this.esNavegador) return;
    this.actualizarVisibilidad();
  }

  toggleMenu(): void {
    this.menuOpen.update(abierto => !abierto);
    this.visible.set(true);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.actualizarVisibilidad();
  }

  private actualizarVisibilidad(): void {
    const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const hero = document.getElementById('home');

    if (this.menuOpen()) {
      this.visible.set(true);
      this.lastScrollY = currentScrollY;
      return;
    }

    // Sin hero no hay nada que ceder: la barra es la única navegación.
    if (!hero) {
      this.visible.set(true);
      this.lastScrollY = currentScrollY;
      return;
    }

    const heroRect = hero.getBoundingClientRect();
    const isInsideHero = heroRect.bottom > 0;

    if (isInsideHero) {
      this.visible.set(false);
      this.lastScrollY = currentScrollY;
      return;
    }

    const scrollingDown = currentScrollY > this.lastScrollY + 4;
    const scrollingUp = currentScrollY < this.lastScrollY - 4;

    if (scrollingDown) {
      this.visible.set(false);
    } else if (scrollingUp) {
      this.visible.set(true);
    }

    this.lastScrollY = currentScrollY;
  }
}

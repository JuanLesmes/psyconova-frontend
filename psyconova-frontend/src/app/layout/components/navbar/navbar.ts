import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, HostListener, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Language, LanguageService } from '../../../core/services/language.service';
import { FocusTrapDirective } from '../../../shared/directives/focus-trap.directive';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, FocusTrapDirective],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit {
  private readonly languageService = inject(LanguageService);
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  menuOpen = false;
  readonly languages = this.languageService.languages;
  readonly activeLanguage = this.languageService.active;

  isNavbarVisible = false;
  private lastScrollY = 0;

  /**
   * La barra se oculta sobre el hero, donde ya hay un menú propio, y reaparece
   * al salir de él. Pero eso sólo se decidía dentro del manejador de scroll.
   *
   * En una página sin hero —las legales y el 404— nadie disparaba ese
   * manejador hasta que el visitante se desplazaba, así que la barra se
   * quedaba invisible al entrar: sin menú, sin logo y sin selector de idioma.
   * Y sus botones seguían recibiendo el foco con el teclado, invisibles.
   *
   * Calcularlo también al arrancar deja cada página con el estado correcto
   * desde el primer instante.
   */
  ngOnInit(): void {
    if (!this.esNavegador) return;
    this.actualizarVisibilidad();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    this.isNavbarVisible = true;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  setLanguage(language: Language): void {
    this.languageService.use(language);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.actualizarVisibilidad();
  }

  private actualizarVisibilidad(): void {
    const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const hero = document.getElementById('home');

    if (this.menuOpen) {
      this.isNavbarVisible = true;
      this.lastScrollY = currentScrollY;
      return;
    }

    // Sin hero no hay nada que ceder: la barra es la única navegación.
    if (!hero) {
      this.isNavbarVisible = true;
      this.lastScrollY = currentScrollY;
      return;
    }

    const heroRect = hero.getBoundingClientRect();
    const isInsideHero = heroRect.bottom > 0;

    if (isInsideHero) {
      this.isNavbarVisible = false;
      this.lastScrollY = currentScrollY;
      return;
    }

    const scrollingDown = currentScrollY > this.lastScrollY + 4;
    const scrollingUp = currentScrollY < this.lastScrollY - 4;

    if (scrollingDown) {
      this.isNavbarVisible = false;
    } else if (scrollingUp) {
      this.isNavbarVisible = true;
    }

    this.lastScrollY = currentScrollY;
  }
}

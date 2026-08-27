import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Language, LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private readonly languageService = inject(LanguageService);

  menuOpen = false;
  readonly languages = this.languageService.languages;
  readonly activeLanguage = this.languageService.active;

  isNavbarVisible = false;
  private lastScrollY = 0;

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    this.isNavbarVisible = true;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  scrollTo(id: string): void {
    this.menuOpen = false;
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  setLanguage(language: Language): void {
    this.languageService.use(language);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const hero = document.getElementById('home');

    if (this.menuOpen) {
      this.isNavbarVisible = true;
      this.lastScrollY = currentScrollY;
      return;
    }

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

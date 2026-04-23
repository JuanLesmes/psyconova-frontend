import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';

type Language = 'ES' | 'FR' | 'IT' | 'EN';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  menuOpen = false;
  activeLanguage: Language = 'ES';
  languages: Language[] = ['ES', 'FR', 'IT', 'EN'];

  isNavbarVisible = false;
  private lastScrollY = 0;

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    this.isNavbarVisible = true;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  setLanguage(language: Language): void {
    this.activeLanguage = language;
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
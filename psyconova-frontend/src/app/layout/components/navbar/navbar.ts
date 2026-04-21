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

  isNavbarVisible = true;
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
    const currentScrollY = window.scrollY || 0;

    if (this.menuOpen) {
      this.isNavbarVisible = true;
      this.lastScrollY = currentScrollY;
      return;
    }

    const hero = document.getElementById('home');
    const heroHeight = hero ? hero.offsetHeight : 700;

    if (currentScrollY <= 20) {
      this.isNavbarVisible = true;
      this.lastScrollY = currentScrollY;
      return;
    }

    if (currentScrollY < heroHeight - 120) {
      this.isNavbarVisible = true;
      this.lastScrollY = currentScrollY;
      return;
    }

    const scrollDifference = currentScrollY - this.lastScrollY;

    if (Math.abs(scrollDifference) < 4) {
      return;
    }

    if (scrollDifference > 0) {
      this.isNavbarVisible = false;
    } else {
      this.isNavbarVisible = true;
    }

    this.lastScrollY = currentScrollY;
  }
}
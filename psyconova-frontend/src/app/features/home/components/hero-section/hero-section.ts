import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type Language = 'ES' | 'FR' | 'IT' | 'EN';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss',
})
export class HeroSection {
  menuOpen = false;
  activeLanguage: Language = 'ES';
  languages: Language[] = ['ES', 'FR', 'IT', 'EN'];

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  setLanguage(language: Language): void {
    this.activeLanguage = language;
  }
}
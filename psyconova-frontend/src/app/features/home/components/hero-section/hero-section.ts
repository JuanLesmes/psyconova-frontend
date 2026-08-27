import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Language, LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss',
})
export class HeroSection {
  private readonly languageService = inject(LanguageService);

  menuOpen = false;
  readonly languages = this.languageService.languages;
  readonly activeLanguage = this.languageService.active;

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
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
}

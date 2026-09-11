import { Component, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MenuBar } from '../../../../shared/components/menu-bar/menu-bar';
import { MenuOverlay } from '../../../../shared/components/menu-overlay/menu-overlay';

/**
 * Portada. Lleva su propia barra de menú porque la barra fija (`Navbar`) se
 * oculta mientras el hero está en pantalla.
 */
@Component({
  selector: 'app-hero-section',
  imports: [TranslatePipe, MenuBar, MenuOverlay],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss',
})
export class HeroSection {
  readonly menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update(abierto => !abierto);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  scrollTo(id: string): void {
    this.menuOpen.set(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }
}

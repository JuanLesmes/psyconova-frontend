import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Language, LanguageService } from '../../../core/services/language.service';

/**
 * Barra superior del sitio: botón del menú, logo y selector de idioma.
 *
 * La usan dos contenedores: la barra de la portada, que va sobre el hero, y
 * la barra fija que aparece al desplazarse. El estado de apertura del menú lo
 * lleva el contenedor, porque también tiene que pasárselo al panel
 * (`app-menu-overlay`). La barra ocupa el alto de su contenedor y centra los
 * tres controles verticalmente.
 */
@Component({
  selector: 'app-menu-bar',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './menu-bar.html',
  styleUrl: './menu-bar.scss',
  host: { '[class.is-collapsed]': 'collapsed()' },
})
export class MenuBar {
  private readonly languageService = inject(LanguageService);

  /** El panel del menú está abierto. Mientras tanto el botón se oculta. */
  readonly open = input.required<boolean>();

  /** `id` del panel que abre el botón, para `aria-controls`. */
  readonly menuId = input.required<string>();

  /**
   * Oculta la barra entera: sale del orden de tabulación y no recibe clics.
   * Se usa cuando la barra está fuera de pantalla o tapada por el menú.
   */
  readonly collapsed = input(false);

  readonly toggled = output<void>();

  readonly languages = this.languageService.languages;
  readonly activeLanguage = this.languageService.active;

  setLanguage(language: Language): void {
    this.languageService.use(language);
  }
}

import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MENU_LINKS } from '../../../core/config/navigation.config';
import { FocusTrapDirective } from '../../directives/focus-trap.directive';

/**
 * Panel del menú a pantalla completa.
 *
 * `role="dialog"` con `aria-modal` es una promesa: quien usa lector de
 * pantalla entiende que lo de detrás no existe mientras esto esté abierto.
 * `focusTrap` la cumple: el foco entra al abrir, da la vuelta dentro, vuelve
 * a su origen al cerrar, y Escape cierra.
 *
 * Cerrado usa `visibility: hidden`, así que sus enlaces quedan fuera del
 * orden de tabulación y nadie tabula hacia un menú invisible.
 */
@Component({
  selector: 'app-menu-overlay',
  imports: [RouterLink, TranslatePipe, FocusTrapDirective],
  templateUrl: './menu-overlay.html',
  styleUrl: './menu-overlay.scss',
})
export class MenuOverlay {
  readonly open = input.required<boolean>();

  /** `id` del panel. Tiene que coincidir con el `aria-controls` del botón que lo abre. */
  readonly menuId = input.required<string>();

  /** Se emite al pulsar Escape, el botón de volver o cualquier enlace. */
  readonly closed = output<void>();

  readonly links = [...MENU_LINKS];
}

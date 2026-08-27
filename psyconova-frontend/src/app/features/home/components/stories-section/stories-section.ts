import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslatePipe } from '@ngx-translate/core';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';
import { TALE, isValidTaleCode } from '../../../../core/config/tales.config';

/**
 * Sección de Cuentos.
 *
 * El cuento vive como archivo suelto en assets y se muestra dentro de un
 * iframe. No se convirtió en componente de Angular a propósito: es una app
 * autocontenida con sus propios estilos y scripts, y así Laura puede
 * actualizarla sin tocar el sitio.
 *
 * Mientras está bloqueado se ve la portada animada pero no se puede
 * interactuar: una capa transparente encima intercepta los toques. Al
 * escribir la palabra clave esa capa desaparece.
 *
 * Sobre el alcance real de la palabra clave, lee el aviso en tales.config.ts.
 */
@Component({
  selector: 'app-stories-section',
  standalone: true,
  imports: [CommonModule, FormsModule, RevealDirective, TranslatePipe],
  templateUrl: './stories-section.html',
  styleUrl: './stories-section.scss',
})
export class StoriesSection {
  private readonly sanitizer = inject(DomSanitizer);

  /** URL del cuento para abrirlo en otra pestaña. */
  readonly taleUrl = TALE.file;

  /** La misma URL, marcada como segura para el iframe. */
  readonly taleFrameUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    TALE.file
  );

  /**
   * El desbloqueo dura sólo lo que dure la visita: al recargar vuelve a
   * pedirse la palabra clave. Es a propósito — no se guarda en localStorage
   * ni en ninguna otra parte.
   */
  unlocked = false;
  code = '';
  wrongCode = false;

  submitCode(): void {
    if (!isValidTaleCode(this.code)) {
      this.wrongCode = true;
      return;
    }

    this.unlocked = true;
    this.wrongCode = false;
    this.code = '';
  }

  /** El error desaparece en cuanto la persona corrige lo que escribió. */
  clearError(): void {
    this.wrongCode = false;
  }
}

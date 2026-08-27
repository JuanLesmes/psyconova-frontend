import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';
import { ContactService } from '../../../../core/services/contact.service';
import {
  CONTACT_FALLBACK_EMAIL,
  CONTACT_INFO,
  CRISIS_LINES,
  CRISIS_WHATSAPP,
  LOCATION,
  MAP_CONSENT_KEY,
  PRIVACY_POLICY_URL,
} from '../../../../core/config/contact.config';

interface ContactForm {
  nombre: string;
  apellido: string;
  celular: string;
  correo: string;
  descripcion: string;
  /** Autorización de tratamiento de datos (Ley 1581 de 2012). */
  consentimiento: boolean;
  /** Campo trampa, oculto a la vista. Si llega con texto, lo llenó un bot. */
  website: string;
}

type SubmitState = 'idle' | 'sending' | 'success' | 'error';

const EMPTY_FORM: ContactForm = {
  nombre: '',
  apellido: '',
  celular: '',
  correo: '',
  descripcion: '',
  consentimiento: false,
  website: '',
};

@Component({
  selector: 'app-cta-section',
  standalone: true,
  imports: [CommonModule, FormsModule, RevealDirective, TranslatePipe],
  templateUrl: './cta-section.html',
  styleUrl: './cta-section.scss',
})
export class CtaSection {
  private readonly contact = inject(ContactService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly privacyPolicyUrl = PRIVACY_POLICY_URL;
  readonly fallbackEmail = CONTACT_FALLBACK_EMAIL;
  readonly contactInfo = CONTACT_INFO;
  readonly crisisLines = CRISIS_LINES;
  readonly crisisWhatsapp = CRISIS_WHATSAPP;
  readonly location = LOCATION;

  /**
   * Mapa embebido de Google. Sólo se construye la URL: el iframe no se añade
   * al DOM hasta que `mapConsent` es true, así que ninguna petición sale a
   * google.com antes de que el visitante lo autorice.
   */
  readonly mapEmbedUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    `https://maps.google.com/maps?q=${encodeURIComponent(LOCATION.query)}` +
      `&z=${LOCATION.zoom}&output=embed`
  );

  /** Indicaciones para llegar. Es un enlace: sólo carga si el usuario lo pulsa. */
  readonly mapLinkUrl =
    'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(LOCATION.query);

  /** El visitante autorizó cargar el mapa de Google. */
  mapConsent = this.readMapConsent();

  state: SubmitState = 'idle';
  form: ContactForm = { ...EMPTY_FORM };

  get isSending(): boolean {
    return this.state === 'sending';
  }

  get submitted(): boolean {
    return this.state === 'success';
  }

  get hasError(): boolean {
    return this.state === 'error';
  }

  onSubmit(): void {
    // El consentimiento es obligatorio: sin él no se envía nada.
    if (!this.form.consentimiento || this.isSending) return;

    this.state = 'sending';

    this.contact
      .send({
        nombre: this.form.nombre,
        apellido: this.form.apellido,
        celular: this.form.celular,
        correo: this.form.correo,
        descripcion: this.form.descripcion,
        consentimientoEn: new Date().toISOString(),
        website: this.form.website,
      })
      .subscribe({
        next: () => {
          this.state = 'success';
          this.form = { ...EMPTY_FORM };
        },
        error: (err: unknown) => {
          // Nunca fingimos un envío exitoso: el usuario debe poder reintentar
          // o escribir directamente al correo.
          console.error('No se pudo enviar la consulta de contacto:', err);
          this.state = 'error';
        },
      });
  }

  resetForm(): void {
    this.state = 'idle';
  }

  /** El visitante acepta cargar el mapa; se recuerda para próximas visitas. */
  acceptMap(): void {
    this.mapConsent = true;

    try {
      localStorage.setItem(MAP_CONSENT_KEY, '1');
    } catch {
      // Sin persistencia el mapa funciona igual, sólo vuelve a preguntar.
    }
  }

  private readMapConsent(): boolean {
    try {
      return localStorage.getItem(MAP_CONSENT_KEY) === '1';
    } catch {
      // Modo privado o almacenamiento bloqueado: se pide de nuevo.
      return false;
    }
  }
}

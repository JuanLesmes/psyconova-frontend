import { Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
  PRIVACY_POLICY_URL,
} from '../../../../core/config/contact.config';
import {
  MapConsent,
  guardarConsentimientoMapa,
  leerConsentimientoMapa,
  olvidarConsentimientoMapa,
} from '../../../../core/config/map-consent';

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

export type SubmitState = 'idle' | 'sending' | 'success' | 'error';

const EMPTY_FORM: ContactForm = {
  nombre: '',
  apellido: '',
  celular: '',
  correo: '',
  descripcion: '',
  consentimiento: false,
  website: '',
};

/**
 * Sección de contacto: líneas de crisis, formulario, datos de contacto y el
 * mapa con consentimiento previo.
 */
@Component({
  selector: 'app-cta-section',
  imports: [FormsModule, RevealDirective, TranslatePipe],
  templateUrl: './cta-section.html',
  styleUrl: './cta-section.scss',
})
export class CtaSection {
  private readonly contact = inject(ContactService);
  private readonly sanitizer = inject(DomSanitizer);

  /** Datos públicos que pinta la plantilla. Salen de core/config/contact.config.ts. */
  readonly contacto = {
    info: CONTACT_INFO,
    fallbackEmail: CONTACT_FALLBACK_EMAIL,
    privacyPolicyUrl: PRIVACY_POLICY_URL,
    crisisLines: CRISIS_LINES,
    crisisWhatsapp: CRISIS_WHATSAPP,
    location: LOCATION,
  };

  /**
   * Mapa embebido de Google. Sólo se construye la URL: el iframe no se añade
   * al DOM hasta que `mapConsent` es true, así que ninguna petición sale a
   * google.com sin que el visitante lo autorice.
   */
  readonly mapEmbedUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    `https://maps.google.com/maps?q=${encodeURIComponent(LOCATION.query)}` +
      `&z=${LOCATION.zoom}&output=embed`
  );

  /** Indicaciones para llegar. Es un enlace: sólo carga si el usuario lo pulsa. */
  readonly mapLinkUrl =
    'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(LOCATION.query);

  /** Decisión sobre el mapa. Ver core/config/map-consent.ts. */
  readonly mapConsent = signal<MapConsent>(leerConsentimientoMapa());

  readonly state = signal<SubmitState>('idle');
  readonly isSending = computed(() => this.state() === 'sending');
  readonly submitted = computed(() => this.state() === 'success');
  readonly hasError = computed(() => this.state() === 'error');

  /** Objeto plano y no signal: `ngModel` escribe en sus campos directamente. */
  form: ContactForm = { ...EMPTY_FORM };

  onSubmit(): void {
    // El consentimiento es obligatorio: sin él no se envía nada.
    if (!this.form.consentimiento || this.isSending()) return;

    this.state.set('sending');

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
          this.state.set('success');
          this.form = { ...EMPTY_FORM };
        },
        error: (err: unknown) => {
          // Nunca se finge un envío exitoso: el usuario debe poder reintentar
          // o escribir directamente al correo.
          console.error('No se pudo enviar la consulta de contacto:', err);
          this.state.set('error');
        },
      });
  }

  resetForm(): void {
    this.state.set('idle');
  }

  /** El visitante acepta cargar el mapa; se recuerda para próximas visitas. */
  acceptMap(): void {
    this.mapConsent.set(true);
    guardarConsentimientoMapa(true);
  }

  /**
   * El visitante rechaza el mapa. Se guarda igual que la aceptación y por el
   * mismo motivo: no volver a preguntar. Insistir después de un «no» convierte
   * la decisión en un trámite que hay que repetir hasta ceder, que es lo
   * contrario de un consentimiento libre.
   */
  rejectMap(): void {
    this.mapConsent.set(false);
    guardarConsentimientoMapa(false);
  }

  /** Vuelve a mostrar la pregunta, para quien cambie de idea. */
  resetMapConsent(): void {
    this.mapConsent.set(null);
    olvidarConsentimientoMapa();
  }
}

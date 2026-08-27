import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { CONTACT_ENDPOINT } from '../config/contact.config';

export interface ContactRequest {
  nombre: string;
  apellido: string;
  celular: string;
  correo: string;
  descripcion: string;
  /** Momento en que el usuario autorizó el tratamiento de sus datos. */
  consentimientoEn: string;
  /** Trampa para bots: siempre vacío en envíos humanos. */
  website: string;
}

/**
 * Envío de las consultas del formulario de contacto.
 *
 * El transporte concreto (función serverless, servicio de formularios o API
 * propia) se define en core/config/contact.config.ts. Este servicio sólo
 * conoce la URL, así que cambiar de proveedor no toca el componente.
 */
@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);

  /** Indica si hay un destino configurado. */
  get isConfigured(): boolean {
    return CONTACT_ENDPOINT.trim().length > 0;
  }

  send(request: ContactRequest): Observable<unknown> {
    if (!this.isConfigured) {
      return throwError(
        () =>
          new Error(
            'CONTACT_ENDPOINT sin configurar: la consulta no se envió. ' +
              'Define el destino en core/config/contact.config.ts.'
          )
      );
    }

    return this.http.post(CONTACT_ENDPOINT, request);
  }
}

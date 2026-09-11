import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CtaSection } from './cta-section';
import { instalarIntersectionObserverFalso } from '../../../../testing/intersection-observer.stub';
import { CONTACT_ENDPOINT, MAP_CONSENT_KEY } from '../../../../core/config/contact.config';

/**
 * El formulario de contacto es el único flujo del sitio que habla con un
 * servidor, y el mapa es el único recurso de terceros que instala cookies.
 * Las dos cosas fallan en silencio: un envío que se pierde no da error en
 * pantalla, y un mapa que carga sin permiso se ve igual de bien.
 */
describe('CtaSection', () => {
  let fixture: ComponentFixture<CtaSection>;
  let componente: CtaSection;
  let http: HttpTestingController;

  const $ = (selector: string) => fixture.nativeElement.querySelector(selector) as HTMLElement | null;

  const consultaCompleta = () => {
    componente.form = {
      nombre: 'Ana',
      apellido: 'Pérez',
      celular: '3000000000',
      correo: 'ana@ejemplo.com',
      descripcion: 'Quisiera una cita.',
      consentimiento: true,
      website: '',
    };
  };

  beforeEach(async () => {
    localStorage.clear();

    instalarIntersectionObserverFalso();

    await TestBed.configureTestingModule({
      imports: [CtaSection],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CtaSection);
    componente = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  describe('envío', () => {
    it('sin autorización de datos no sale ninguna petición', () => {
      consultaCompleta();
      componente.form.consentimiento = false;

      componente.onSubmit();

      http.expectNone(CONTACT_ENDPOINT);
      expect(componente.state()).toBe('idle');
    });

    it('envía la consulta con el campo trampa vacío y la fecha del consentimiento', () => {
      consultaCompleta();

      componente.onSubmit();

      const peticion = http.expectOne(CONTACT_ENDPOINT);
      expect(peticion.request.method).toBe('POST');
      expect(peticion.request.body).toMatchObject({
        nombre: 'Ana',
        correo: 'ana@ejemplo.com',
        website: '',
      });
      expect(peticion.request.body.consentimientoEn).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      peticion.flush({ ok: true });
    });

    it('al llegar bien, confirma en pantalla y vacía el formulario', () => {
      consultaCompleta();
      componente.onSubmit();
      http.expectOne(CONTACT_ENDPOINT).flush({ ok: true });
      fixture.detectChanges();

      expect(componente.submitted()).toBe(true);
      expect($('.ctc-success')).not.toBeNull();
      expect($('form.ctc-form')).toBeNull();
      expect(componente.form.nombre).toBe('');
      expect(componente.form.consentimiento).toBe(false);
    });

    it('si el servidor falla, nunca finge que se envió y ofrece el correo', () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      consultaCompleta();
      componente.onSubmit();
      http.expectOne(CONTACT_ENDPOINT).flush('caído', { status: 500, statusText: 'Error' });
      fixture.detectChanges();

      expect(componente.hasError()).toBe(true);
      expect(componente.submitted()).toBe(false);
      // El formulario sigue ahí con lo escrito, para poder reintentar.
      expect($('form.ctc-form')).not.toBeNull();
      expect(componente.form.nombre).toBe('Ana');
      expect($('.ctc-error')?.textContent).toContain(componente.contacto.fallbackEmail);
    });

    it('no manda dos veces mientras la primera está en camino', () => {
      consultaCompleta();

      componente.onSubmit();
      componente.onSubmit();

      const peticiones = http.match(CONTACT_ENDPOINT);
      expect(peticiones).toHaveLength(1);
      peticiones[0].flush({ ok: true });
    });

    it('reintentar tras un error vuelve al estado inicial', () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      consultaCompleta();
      componente.onSubmit();
      http.expectOne(CONTACT_ENDPOINT).flush('caído', { status: 500, statusText: 'Error' });

      componente.resetForm();

      expect(componente.state()).toBe('idle');
    });
  });

  describe('mapa con consentimiento previo', () => {
    it('sin decisión previa no hay iframe en el DOM: sólo la pregunta', () => {
      expect($('iframe')).toBeNull();
      expect($('.ctc-map__gate')).not.toBeNull();
    });

    it('al aceptar aparece el iframe y la decisión queda guardada', () => {
      componente.acceptMap();
      fixture.detectChanges();

      expect($('iframe.ctc-map__embed')).not.toBeNull();
      expect(localStorage.getItem(MAP_CONSENT_KEY)).toBe('1');
    });

    it('al rechazar se muestra la dirección, sin iframe, y no se vuelve a preguntar', () => {
      componente.rejectMap();
      fixture.detectChanges();

      expect($('iframe')).toBeNull();
      expect($('.ctc-map__gate--rejected')?.textContent).toContain(componente.contacto.location.street);
      expect(localStorage.getItem(MAP_CONSENT_KEY)).toBe('0');
    });

    it('la decisión guardada se respeta en la siguiente visita', async () => {
      localStorage.setItem(MAP_CONSENT_KEY, '1');

      const otra = TestBed.createComponent(CtaSection);
      otra.detectChanges();

      expect(otra.nativeElement.querySelector('iframe.ctc-map__embed')).not.toBeNull();
    });

    it('cambiar de idea borra lo guardado y vuelve a preguntar', () => {
      componente.rejectMap();
      componente.resetMapConsent();
      fixture.detectChanges();

      expect(localStorage.getItem(MAP_CONSENT_KEY)).toBeNull();
      expect($('.ctc-map__gate')).not.toBeNull();
      expect($('.ctc-map__gate--rejected')).toBeNull();
    });
  });
});

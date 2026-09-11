import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FocusTrapDirective } from './focus-trap.directive';

/**
 * Un encierro de foco roto no da ningún error.
 *
 * Quien navega con teclado abre el menú, sigue tabulando y el foco se va a la
 * página de debajo — que no puede ver, porque el menú la tapa. Desde fuera
 * todo parece funcionar; sólo lo nota quien depende del teclado.
 *
 * Estas pruebas fijan las tres partes de la promesa que hace `aria-modal`.
 */
@Component({
  imports: [FocusTrapDirective],
  template: `
    <button id="fuera">Fuera del panel</button>

    <div [appFocusTrap]="abierto" (escapePressed)="cerrado = true">
      <button id="primero">Primero</button>
      <a id="medio" href="#x">Enlace del medio</a>
      <button id="ultimo">Último</button>
    </div>
  `,
})
class Anfitrion {
  abierto = false;
  cerrado = false;
}

describe('FocusTrapDirective', () => {
  let fixture: ComponentFixture<Anfitrion>;
  let anfitrion: Anfitrion;

  const $ = (id: string) => fixture.nativeElement.querySelector('#' + id) as HTMLElement;

  const tabular = (shift = false) => {
    const evento = new KeyboardEvent('keydown', {
      key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true,
    });
    document.activeElement!.dispatchEvent(evento);
    return evento;
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [Anfitrion] }).compileComponents();
    fixture = TestBed.createComponent(Anfitrion);
    anfitrion = fixture.componentInstance;
    fixture.detectChanges();
  });

  const abrir = () => {
    $('fuera').focus();
    anfitrion.abierto = true;
    fixture.detectChanges();
    vi.advanceTimersByTime(100);
  };

  it('al abrir, el foco entra en el panel', () => {
    abrir();
    expect(document.activeElement?.id).toBe('primero');
  });

  it('desde el último, Tab vuelve al primero en vez de salirse', () => {
    abrir();
    $('ultimo').focus();

    const evento = tabular();

    expect(evento.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('primero');
  });

  it('desde el primero, Mayús+Tab va al último en vez de salirse', () => {
    abrir();
    $('primero').focus();

    const evento = tabular(true);

    expect(evento.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('ultimo');
  });

  it('en medio del panel, Tab sigue su curso normal', () => {
    // Sólo hay que intervenir en los extremos: interceptar todos los Tab
    // romperia el orden natural y desconcertaria a quien navega.
    abrir();
    $('medio').focus();

    const evento = tabular();

    expect(evento.defaultPrevented).toBe(false);
  });

  it('Escape avisa para que el componente cierre', () => {
    abrir();
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    );

    expect(anfitrion.cerrado).toBe(true);
  });

  it('al cerrar, el foco vuelve a quien lo abrió', () => {
    abrir();
    expect(document.activeElement?.id).toBe('primero');

    anfitrion.abierto = false;
    fixture.detectChanges();

    expect(document.activeElement?.id).toBe('fuera');
  });

  it('cerrado, no toca ni el foco ni las teclas', () => {
    // El panel oculto no debe secuestrar Tab: sus elementos ya quedan fuera
    // del orden de tabulacion por el CSS.
    $('fuera').focus();
    const evento = tabular();

    expect(evento.defaultPrevented).toBe(false);
    expect(document.activeElement?.id).toBe('fuera');
  });

  it('no arrastra el foco de vuelta si el usuario ya lo movió a otra parte', () => {
    abrir();

    // El usuario cierra el menú pulsando un enlace que le lleva a otro sitio.
    $('fuera').focus();
    anfitrion.abierto = false;
    fixture.detectChanges();

    expect(document.activeElement?.id).toBe('fuera');
  });
});

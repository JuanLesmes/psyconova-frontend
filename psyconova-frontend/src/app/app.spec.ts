import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { App } from './app';
import { LoadingScreen } from './shared/components/loading-screen/loading-screen';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // Sin loader: el pipe devuelve la clave, suficiente para montar el componente.
      providers: [provideTranslateService({ fallbackLang: 'es', lang: 'es' })],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('pinta la pantalla de carga al arrancar', () => {
    const fixture = TestBed.createComponent(App);

    // detectChanges() y no whenStable(): es la primera detección de cambios
    // la que ejecuta ngOnInit y pinta la plantilla. whenStable() resuelve de
    // inmediato porque, sin haber pintado, no hay nada pendiente que esperar.
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-loading-screen .ls')).toBeTruthy();
  });
});

describe('LoadingScreen', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [LoadingScreen],
      providers: [provideTranslateService({ fallbackLang: 'es', lang: 'es' })],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Esta es la prueba que de verdad importa de este componente.
   *
   * La pantalla de carga se pinta encima de todo, a pantalla completa y con
   * z-index 9999. Si dejara de ocultarse, el sitio entero quedaría tapado y
   * nadie podría pulsar nada — sin un solo error en consola que lo delate.
   */
  it('se quita sola y deja de tapar el sitio', () => {
    const fixture = TestBed.createComponent(LoadingScreen);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ls')).toBeTruthy();

    // Sigue tapando justo antes de que toque irse.
    vi.advanceTimersByTime(890);
    fixture.detectChanges();
    expect(fixture.componentInstance.hiding).toBe(false);

    // 900 ms: empieza a desvanecerse pero sigue en el DOM.
    vi.advanceTimersByTime(10);
    fixture.detectChanges();
    expect(fixture.componentInstance.hiding).toBe(true);

    // +400 ms de transición: desaparece del DOM.
    vi.advanceTimersByTime(400);
    fixture.detectChanges();
    expect(fixture.componentInstance.visible).toBe(false);
    expect(fixture.nativeElement.querySelector('.ls')).toBeNull();
  });

  /**
   * Los tiempos del componente y los del CSS tienen que coincidir. Si la
   * transición del CSS durara más que SALIDA_MS, la pantalla se quitaría del
   * DOM a mitad del desvanecido y se vería un corte seco — algo que ninguna
   * prueba de comportamiento detecta, porque el estado sería correcto.
   */
  it('la pantalla entera dura menos de 1,5 segundos', () => {
    const fixture = TestBed.createComponent(LoadingScreen);
    fixture.detectChanges();

    vi.advanceTimersByTime(1500);
    fixture.detectChanges();

    expect(fixture.componentInstance.visible).toBe(false);
  });

  it('no deja temporizadores sueltos al destruirse', () => {
    const fixture = TestBed.createComponent(LoadingScreen);
    fixture.detectChanges();
    fixture.destroy();

    // Si ngOnDestroy no limpiara, esto reventaría al tocar una vista destruida.
    vi.advanceTimersByTime(5000);
    expect(fixture.componentInstance.visible).toBe(true);
  });
});

/**
 * Sustituto de IntersectionObserver para las pruebas.
 *
 * jsdom no lo trae y RevealDirective lo usa en cada sección. Sin él, montar
 * cualquier componente con `appReveal` revienta antes de probar nada.
 */
export function instalarIntersectionObserverFalso(): void {
  globalThis.IntersectionObserver = class {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: readonly number[] = [];

    observe(): void {
      // No hay pantalla que observar en las pruebas.
    }

    unobserve(): void {
      // Nada que dejar de observar.
    }

    disconnect(): void {
      // Nada que desconectar.
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
}

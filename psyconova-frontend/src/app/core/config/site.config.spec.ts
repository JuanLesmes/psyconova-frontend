import { Routes } from '@angular/router';
import { describe, it, expect } from 'vitest';
import { PAGES } from './site.config';
import { routes } from '../../app.routes';

/**
 * El router y PAGES tienen que decir lo mismo.
 *
 * Son dos listas separadas que describen las mismas páginas: el router las
 * sirve, PAGES les pone los metadatos y alimenta el sitemap. Si alguien añade
 * una ruta y se olvida de la otra lista, la página existe y se prerenderiza
 * pero sale sin título, sin descripción, sin canonical y fuera del sitemap.
 *
 * Nada de eso da un error. Simplemente esa página no aparece en Google, y
 * puede pasar un año hasta que alguien lo note.
 */

/** Recorre el árbol de rutas y devuelve las rutas reales, en forma «/ruta». */
function rutasDelRouter(rutas: Routes, prefijo = ''): string[] {
  const encontradas: string[] = [];

  for (const ruta of rutas) {
    // El comodín no es una página: es la red de seguridad para lo que no existe.
    if (ruta.path === '**') continue;

    const completa = [prefijo, ruta.path].filter(p => p !== '' && p !== undefined).join('/');

    /**
     * Cuenta como página si pinta algo (directo o bajo demanda) y no envuelve
     * a nadie. La condición de las hijas importa: MainLayoutComponent tiene
     * componente propio y además hijas, porque es la cáscara (navbar, pie)
     * alrededor de las páginas de verdad. Sin descartarlo, la raíz saldría dos
     * veces: una por el layout y otra por la portada que vive dentro.
     */
    if ((ruta.component || ruta.loadComponent) && !ruta.children) {
      encontradas.push('/' + completa);
    }

    if (ruta.children) {
      encontradas.push(...rutasDelRouter(ruta.children, completa));
    }
  }

  return encontradas;
}

describe('el router y PAGES no se separan', () => {
  const delRouter: string[] = rutasDelRouter(routes).sort();

  // `as string[]`: PAGES es `as const`, asi que sus rutas son un tipo literal
  // y no se pueden comparar con las del router, que son string a secas.
  const dePages: string[] = (Object.values(PAGES).map(p => p.path) as string[]).sort();

  it('toda ruta del router tiene sus metadatos en PAGES', () => {
    const huerfanas = delRouter.filter(r => !dePages.includes(r));

    expect(
      huerfanas,
      `Estas rutas se sirven pero no están en PAGES, así que saldrían sin ` +
        `título, sin canonical y fuera del sitemap: ${huerfanas.join(', ')}`
    ).toEqual([]);
  });

  it('toda página de PAGES existe en el router', () => {
    const inventadas = dePages.filter(p => !delRouter.includes(p));

    expect(
      inventadas,
      `Estas páginas están en el sitemap pero el router no las sirve, ` +
        `así que el buscador recibiría URLs muertas: ${inventadas.join(', ')}`
    ).toEqual([]);
  });

  it('las dos listas describen exactamente las mismas páginas', () => {
    expect(delRouter).toEqual(dePages);
  });
});

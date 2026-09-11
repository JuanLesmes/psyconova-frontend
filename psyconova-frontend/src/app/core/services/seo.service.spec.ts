import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SeoService } from './seo.service';
import { PAGES, SITE, absoluteUrl } from '../config/site.config';

describe('absoluteUrl', () => {
  it('la portada lleva barra final', () => {
    expect(absoluteUrl('/')).toBe('https://psyconova.com/');
    expect(absoluteUrl('')).toBe('https://psyconova.com/');
  });

  it('el resto de rutas no la duplican', () => {
    expect(absoluteUrl('/terminos-de-uso')).toBe('https://psyconova.com/terminos-de-uso');
  });

  it('acepta la ruta con o sin barra inicial', () => {
    expect(absoluteUrl('terminos-de-uso')).toBe(absoluteUrl('/terminos-de-uso'));
  });

  it('el dominio no lleva barra al final', () => {
    // Si la llevara, todas las URLs saldrian con doble barra y el buscador
    // las trataria como paginas distintas de las buenas.
    expect(SITE.url.endsWith('/')).toBe(false);
  });
});

describe('PAGES', () => {
  const paginas = Object.entries(PAGES);

  it.each(paginas)('la pagina "%s" tiene descripcion util', (_clave, pagina) => {
    // Google recorta alrededor de 155 caracteres. Mas corta de 50 no dice
    // nada; mucho mas larga se corta a media frase.
    expect(pagina.description.length).toBeGreaterThan(50);
    expect(pagina.description.length).toBeLessThan(300);
  });

  it('ninguna pagina repite la ruta de otra', () => {
    // Dos paginas con la misma ruta compartirian canonical, que es
    // exactamente el fallo que este servicio existe para evitar.
    const rutas = paginas.map(([, p]) => p.path);
    expect(new Set(rutas).size).toBe(rutas.length);
  });

  it('ninguna pagina repite el titulo de otra', () => {
    const titulos = paginas.map(([, p]) => p.title);
    expect(new Set(titulos).size).toBe(titulos.length);
  });
});

describe('SeoService', () => {
  let seo: SeoService;
  let doc: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    seo = TestBed.inject(SeoService);
    doc = TestBed.inject(DOCUMENT);

    doc.head.querySelectorAll('link[rel="canonical"], script#datos-estructurados')
      .forEach(el => el.remove());
  });

  it('pone un canonical absoluto', () => {
    seo.apply(PAGES.privacy);

    const link = doc.head.querySelector('link[rel="canonical"]');
    expect(link?.getAttribute('href')).toBe('https://psyconova.com/politica-de-privacidad');
  });

  /**
   * La prueba que justifica el diseño del servicio.
   *
   * Al hidratar, el navegador vuelve a ejecutar el ngOnInit que ya corrio al
   * prerenderizar, asi que apply() se llama dos veces sobre el mismo head. Y
   * al navegar entre paginas, una vez por cada una.
   *
   * Si cada llamada anadiera un <link> nuevo, el documento acabaria con
   * varios canonical apuntando a sitios distintos — para un buscador eso es
   * tan malo como tener el canonical equivocado, y no da ningun error.
   */
  it('no duplica el canonical al llamarlo varias veces', () => {
    seo.apply(PAGES.home);
    seo.apply(PAGES.privacy);
    seo.apply(PAGES.terms);

    expect(doc.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(doc.head.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://psyconova.com/terminos-de-uso');
  });

  it('el titulo lleva el nombre del sitio detras', () => {
    seo.apply(PAGES.terms);
    expect(doc.title).toBe('Términos de uso | PSYCONOVA');
  });

  it('la imagen social es absoluta: las redes no resuelven rutas relativas', () => {
    seo.apply(PAGES.home);

    const og = doc.head.querySelector('meta[property="og:image"]');
    expect(og?.getAttribute('content')).toMatch(/^https:\/\//);
  });

  it('por defecto la pagina se indexa', () => {
    seo.apply(PAGES.home);

    const robots = doc.head.querySelector('meta[name="robots"]');
    expect(robots?.getAttribute('content')).toBe('index, follow');
  });

  it('marca noindex cuando se pide', () => {
    seo.apply({ ...PAGES.home, noindex: true });

    const robots = doc.head.querySelector('meta[name="robots"]');
    expect(robots?.getAttribute('content')).toBe('noindex, nofollow');
  });

  it('tampoco duplica los datos estructurados', () => {
    seo.setBusinessData({ '@type': 'MedicalBusiness', name: 'uno' });
    seo.setBusinessData({ '@type': 'MedicalBusiness', name: 'dos' });

    const scripts = doc.head.querySelectorAll('script#datos-estructurados');
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0].textContent ?? '{}').name).toBe('dos');
  });

  /**
   * Navegar de la portada a una página legal sin recargar dejaba la ficha de
   * negocio pegada al documento: los términos de uso quedaban declarándose
   * consultorio de psicología. Se detectó recorriendo el sitio con el router
   * en un navegador real.
   */
  it('la ficha de negocio no sobrevive al cambiar de pagina', () => {
    seo.apply(PAGES.home);
    seo.setBusinessData({ '@type': 'MedicalBusiness', name: 'PSYCONOVA' });
    expect(doc.head.querySelectorAll('script#datos-estructurados')).toHaveLength(1);

    seo.apply(PAGES.terms);
    expect(doc.head.querySelectorAll('script#datos-estructurados')).toHaveLength(0);
  });
});

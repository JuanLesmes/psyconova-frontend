import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { PageSeo, SITE, absoluteUrl } from '../config/site.config';

/**
 * Deja una página lista para buscadores y redes sociales en una sola llamada.
 *
 * `apply()` pone todo: título, descripción, canonical, Open Graph, Twitter
 * Card y robots. Si una página lo llama está completa; si no, le falta todo.
 * Repartir el SEO entre index.html y cada componente lleva al fallo más
 * común: un canonical estático en index.html que hace que cada página le diga
 * al buscador «ignórame, la buena es la portada», peor que no tener canonical.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  apply(page: PageSeo): void {
    const url = absoluteUrl(page.path);
    const titulo = `${page.title} | ${SITE.name}`;
    const imagen = `${SITE.url}/${SITE.socialImage}`;

    this.title.setTitle(titulo);

    this.meta.updateTag({ name: 'description', content: page.description });
    this.meta.updateTag({
      name: 'robots',
      content: page.noindex ? 'noindex, nofollow' : 'index, follow',
    });

    // Open Graph: lo que leen WhatsApp, LinkedIn y Facebook para armar la
    // tarjeta del enlace. Ninguno de los tres ejecuta JavaScript, así que
    // estas etiquetas sólo sirven porque el sitio se prerenderiza.
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE.name });
    this.meta.updateTag({ property: 'og:locale', content: SITE.locale });
    this.meta.updateTag({ property: 'og:title', content: titulo });
    this.meta.updateTag({ property: 'og:description', content: page.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: imagen });
    this.meta.updateTag({ property: 'og:image:width', content: String(SITE.socialImageWidth) });
    this.meta.updateTag({ property: 'og:image:height', content: String(SITE.socialImageHeight) });
    this.meta.updateTag({ property: 'og:image:alt', content: `Logotipo de ${SITE.name}` });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: titulo });
    this.meta.updateTag({ name: 'twitter:description', content: page.description });
    this.meta.updateTag({ name: 'twitter:image', content: imagen });

    this.setCanonical(url);

    /**
     * Los datos estructurados se borran en cada página. Sólo la portada los
     * pone, justo después de esta llamada. Sin este borrado, al navegar de la
     * portada a los términos sin recargar, la ficha de negocio se quedaría
     * pegada al documento y un rastreador que ejecute JavaScript vería una
     * página legal declarándose consultorio de psicología. En el HTML
     * prerenderizado no ocurre, porque cada página se genera en limpio.
     */
    this.clearBusinessData();
  }

  /**
   * El canonical es un <link>, no un <meta>, así que el servicio Meta de
   * Angular no lo cubre y hay que tocar el head a mano.
   *
   * Se reutiliza el mismo elemento en vez de añadir uno nuevo: al navegar
   * entre páginas se acumularían varios canonical, y un documento con dos
   * canonical distintos es tan malo como uno equivocado.
   */
  private setCanonical(url: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }

    link.setAttribute('href', url);
  }

  /**
   * Datos estructurados del negocio, para la ficha de búsqueda local.
   *
   * Sólo tiene sentido en la portada: repetirlo en cada página no aporta y
   * puede confundir al buscador sobre cuál es la página del negocio.
   */
  setBusinessData(datos: object): void {
    let script = this.document.head.querySelector<HTMLScriptElement>(`script#${SeoService.ID_DATOS}`);

    if (!script) {
      script = this.document.createElement('script');
      script.id = SeoService.ID_DATOS;
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(datos);
  }

  private clearBusinessData(): void {
    this.document.head
      .querySelector(`script#${SeoService.ID_DATOS}`)
      ?.remove();
  }

  private static readonly ID_DATOS = 'datos-estructurados';
}

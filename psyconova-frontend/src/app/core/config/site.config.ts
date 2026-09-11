/**
 * Datos del sitio que aparecen en varios lugares a la vez.
 *
 * El dominio vive aquí y en ningún otro lado: el sitemap y el robots.txt se
 * generan a partir de esta constante en el `prebuild`, así que no pueden
 * desincronizarse. Con copias sueltas en index.html, sitemap y robots, alguna
 * se quedaría atrás y un sitemap con el dominio viejo le entregaría al
 * buscador una lista de URLs muertas.
 */
export const SITE = {
  /** Sin barra final: las rutas la ponen. */
  url: 'https://psyconova.com',
  name: 'PSYCONOVA',
  locale: 'es_CO',
  /** Imagen para WhatsApp, LinkedIn y X. Se genera con scripts/social-image.mjs */
  socialImage: 'assets/images/social/psyconova-og.jpg',
  socialImageWidth: 1200,
  socialImageHeight: 630,
} as const;

/** Convierte una ruta interna en URL absoluta, que es lo que piden canonical y Open Graph. */
export function absoluteUrl(path: string): string {
  if (path === '/' || path === '') return SITE.url + '/';
  return SITE.url + (path.startsWith('/') ? path : '/' + path);
}

/** Metadatos de una página. Lo que necesita SeoService para dejarla completa. */
export interface PageSeo {
  /** Sin el nombre del sitio: SeoService lo añade. */
  title: string;
  description: string;
  /** Ruta interna, no URL absoluta. */
  path: string;
  /** Fuera del índice de los buscadores. Por defecto se indexa. */
  noindex?: boolean;
}

/**
 * Las páginas del sitio, en un solo lugar. De aquí salen los metadatos que
 * aplica cada componente, las rutas que se prerenderizan y las URLs del
 * sitemap: añadir una página aquí la mete en los tres a la vez.
 */
export const PAGES = {
  home: {
    title: 'Salud mental con realidad virtual en Bogotá',
    description:
      'PSYCONOVA integra psicología clínica, realidad virtual y ciberpsicología para ' +
      'acercar el bienestar emocional a la vida cotidiana. Consulta en Bogotá con ' +
      'Laura Lesmes, psicóloga clínica.',
    path: '/',
  },
  privacy: {
    title: 'Política de tratamiento de datos personales',
    description:
      'Cómo PSYCONOVA recoge, usa y protege tus datos personales, y cómo puedes ' +
      'ejercer tus derechos según la Ley 1581 de 2012.',
    path: '/politica-de-privacidad',
  },
  terms: {
    title: 'Términos de uso',
    description:
      'Condiciones de uso del sitio de PSYCONOVA: alcance del contenido, ' +
      'limitaciones y aviso sobre atención en crisis.',
    path: '/terminos-de-uso',
  },
  /**
   * Página de error. `noindex` la deja fuera de los buscadores y, de paso,
   * fuera del sitemap: el generador sólo lista las páginas indexables.
   */
  notFound: {
    title: 'Página no encontrada',
    description:
      'La dirección que buscas no existe en el sitio de PSYCONOVA. ' +
      'Desde el inicio puedes llegar al resto del contenido.',
    path: '/404',
    noindex: true,
  },
} as const satisfies Record<string, PageSeo>;

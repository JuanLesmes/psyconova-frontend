/**
 * Datos del sitio que aparecen en varios sitios a la vez.
 *
 * ── Por qué el dominio vive aquí y en ningún otro lado ──
 *
 * Normalmente el dominio acaba copiado en index.html, en el sitemap y en
 * robots.txt. Al cambiarlo, alguno se queda atrás — y un sitemap con el
 * dominio viejo le entrega al buscador una lista de URLs muertas.
 *
 * Aquí es la única copia. El sitemap y el robots se GENERAN a partir de esta
 * constante en el `prebuild`, así que no pueden desincronizarse.
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
 * Las páginas del sitio, en un solo sitio.
 *
 * De aquí salen tres cosas: los metadatos que aplica cada componente, las
 * rutas que se prerenderizan y las URLs del sitemap. Añadir una página aquí
 * la mete en los tres a la vez, que es justo lo que evita que alguien se
 * olvide de una.
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
} as const satisfies Record<string, PageSeo>;

/**
 * Entradas del menú principal.
 *
 * El sitio es una sola página con anclas: cada entrada apunta a un `id` de la
 * portada. La barra fija y la barra de la portada comparten esta lista, así
 * que añadir o quitar una sección se hace en un único sitio.
 */
export const MENU_LINKS = [
  { fragment: 'home', key: 'nav.home' },
  { fragment: 'nosotros', key: 'nav.what' },
  { fragment: 'services', key: 'nav.services' },
  { fragment: 'equipo', key: 'nav.about' },
  { fragment: 'contact', key: 'nav.contact' },
] as const;

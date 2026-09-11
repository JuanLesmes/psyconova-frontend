/**
 * Destino de las consultas del formulario de contacto. Mientras esté vacío,
 * el formulario no envía nada y muestra un error explícito en vez de fingir
 * que la consulta llegó. Otras opciones según el despliegue: Web3Forms
 * ('https://api.web3forms.com/submit', más su access_key) o un backend propio.
 */
export const CONTACT_ENDPOINT = '/.netlify/functions/contact';

/**
 * Datos de contacto públicos. Viven aquí y no en los archivos de traducción
 * porque no se traducen, y en un solo sitio para que ninguna plantilla se
 * quede con un dato distinto al de las demás.
 */
export const CONTACT_INFO = {
  whatsapp: '+57 305 373 2503',
  /** Mismo número sin espacios ni signos, como lo exige wa.me */
  whatsappLink: 'https://wa.me/573053732503',
  email: 'laura.lesmes@psyconova.com',
};

/** Correo mostrado al usuario como alternativa si el envío falla. */
export const CONTACT_FALLBACK_EMAIL = CONTACT_INFO.email;

/** Ruta de la política de privacidad enlazada desde el consentimiento. */
export const PRIVACY_POLICY_URL = '/politica-de-privacidad';

/**
 * Líneas de atención en crisis que se muestran sobre el formulario. Números
 * de Colombia, verificados contra las fuentes oficiales (minsalud.gov.co y
 * saludcapital.gov.co) en agosto de 2026. Cualquier cambio se confirma con la
 * fuente oficial: un número equivocado en una línea de crisis es peor que ninguno.
 */
export const CRISIS_LINES = [
  { number: '106', tel: 'tel:106', key: 'psychological' },
  { number: '192', tel: 'tel:192', key: 'national' },
  { number: '123', tel: 'tel:123', key: 'emergency' },
];

/** La Línea 106 también atiende por WhatsApp. */
export const CRISIS_WHATSAPP = {
  display: '300 754 8933',
  link: 'https://wa.me/573007548933',
};

/** Ubicación mostrada en el mapa de la sección de contacto. */
export const LOCATION = {
  street: 'Carrera 13 #90-20',
  building: 'Edificio Professional Bureau',
  city: 'Bogotá, Colombia',
  /** Consulta que resuelve Google: su geocodificador acierta con esta dirección. */
  get query(): string {
    return `${this.street}, ${this.city}`;
  },
  /** Nivel de acercamiento del mapa embebido (17 ≈ manzana). */
  zoom: 17,
};

/**
 * Clave del consentimiento del mapa en localStorage. El mapa de Google instala
 * cookies de google.com, así que no se carga hasta que el visitante lo autoriza:
 * un aviso posterior a la cookie no cumple con nada. Si el texto del aviso
 * cambia de forma sustancial, sube la versión para volver a pedir el consentimiento.
 */
export const MAP_CONSENT_KEY = 'psyconova.mapConsent.v1';

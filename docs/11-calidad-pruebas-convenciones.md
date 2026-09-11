# 11 · Calidad, pruebas y convenciones

## Configuración de TypeScript

El proyecto está en **modo estricto completo**, y eso es una buena noticia: el compilador
atrapa una cantidad enorme de errores antes de que lleguen al navegador.

```jsonc
"strict": true,
"noImplicitOverride": true,
"noPropertyAccessFromIndexSignature": true,
"noImplicitReturns": true,
"noFallthroughCasesInSwitch": true,
```

Y del lado de Angular:

```jsonc
"strictTemplates": true,          // comprueba los tipos DENTRO del HTML
"strictInjectionParameters": true,
"strictInputAccessModifiers": true
```

`strictTemplates` es el que más ayuda en el día a día: si pasas un `string` a una entrada que
espera un `number`, el error salta al compilar, no en producción.

`noPropertyAccessFromIndexSignature` explica un detalle que si no, parece raro: en la
función serverless las variables de entorno se leen como `process.env['RESEND_API_KEY']`
con corchetes, no con punto. Es esa opción la que lo exige.

`tsconfig.spec.json` sólo incluye `src/**/*.spec.ts`. Por eso las reglas de validación del
formulario viven en `src/app/core/contact/` y no dentro de `netlify/functions/`: lo que se
quede fuera de `src/` no se puede probar.

## Pruebas

**Estado actual: 119 pruebas en 10 archivos.** Todas pasan, y tardan unos 15 segundos.

```bash
npm test                      # modo vigilancia
npx ng test --watch=false     # una vez y termina
```

El sistema es **Vitest sobre jsdom**, a través del constructor `@angular/build:unit-test` de
Angular 21. No hay Karma ni navegador real. Los globales de Vitest (`describe`, `it`,
`expect`, `vi`) están disponibles sin importar, aunque varios archivos los importan
explícitamente.

### Qué se prueba hoy

| Archivo | Pruebas | Qué cubre |
|---|---|---|
| `app.spec.ts` | 5 | La app arranca y pinta la pantalla de carga; la pantalla se quita sola, dura menos de 1,5 s y no deja temporizadores sueltos |
| `core/config/consent.spec.ts` | 11 | La tabla de decisión del consentimiento del mapa: sólo `'1'` es aceptado, sólo `'0'` rechazado, todo lo demás es "sin decidir"; la clave lleva versión |
| `core/config/site.config.spec.ts` | 3 | El router y `PAGES` describen exactamente las mismas páginas (acepta `component` o `loadComponent`) |
| `core/config/tales.config.spec.ts` | 21 | `isValidTaleCode()` con mayúsculas, tildes, espacios y variantes; lo que no debe abrir; `normalizeCode()`; la configuración de `TALE` |
| `core/contact/contact-rules.spec.ts` | 30 | `validarConsulta()`: caso normal, trampa de bots (y que va primero), campos obligatorios, consentimiento; `esCorreoValido()` con direcciones legítimas y rotas; `recortar()`; `escaparHtml()` |
| `core/services/language.service.spec.ts` | 11 | Resolución del idioma inicial (guardado → navegador → español), persistencia, `<html lang>`, almacenamiento bloqueado |
| `core/services/seo.service.spec.ts` | 18 | `absoluteUrl()`, que ninguna página repita ruta ni título y todas tengan descripción útil, canonical único, `noindex`, datos estructurados que no sobreviven al cambiar de página |
| `features/home/components/cta-section/cta-section.spec.ts` | 11 | Envío con y sin consentimiento, éxito, error sin fingir envío, doble envío, reintento; los tres estados del mapa con `localStorage` |
| `features/home/pages/home/home.spec.ts` | 1 | La portada entera se monta |
| `shared/directives/focus-trap.directive.spec.ts` | 8 | Foco al abrir, Tab y Mayús+Tab dan la vuelta, Escape avisa, el foco vuelve a su origen al cerrar |

Casi todas están escritas a mano y se nota: cada archivo abre con un comentario que explica
qué protege y por qué importa (*"un mapa que carga sin permiso se ve igual de bien"*).
La única prueba de plantilla es la de `Home`, que aun así tiene valor: monta las seis
secciones a la vez.

### Lo que no se prueba

- **La función serverless en sí** (`contact.mts`): el envoltorio HTTP, las variables de
  entorno y la llamada a Resend. Las reglas que aplica sí están probadas. Se puede ejercitar
  a mano con `netlify dev`; ver [07 · Formulario](./07-formulario-de-contacto.md#probar-en-local).
- `IntroSection`, `StoriesSection`, `Navbar` (la lógica de scroll), `RevealDirective`,
  `MenuBar` y `MenuOverlay` como componentes.
- Los scripts de `scripts/`.

### Cómo escribir una prueba de componente

El patrón está en `cta-section.spec.ts` y `home.spec.ts`. Lo esencial es que **casi
cualquier componente de este proyecto necesita al menos el servicio de traducción**, muchos
también el router, y cualquiera que use `appReveal` necesita el sustituto de
`IntersectionObserver`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { instalarIntersectionObserverFalso } from '../../testing/intersection-observer.stub';

instalarIntersectionObserverFalso();

await TestBed.configureTestingModule({
  imports: [MiComponente],
  providers: [
    provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
    provideRouter([]),
  ],
}).compileComponents();
```

Sin cargador de traducciones, el pipe `translate` devuelve la clave literal. Para casi
cualquier prueba eso basta y evita tener que simular peticiones HTTP. Para el formulario,
`provideHttpClientTesting()` y `HttpTestingController` permiten responder al `POST` a mano.

Dos detalles que ahorran tiempo: `fixture.detectChanges()` y no `whenStable()` para que
`ngOnInit` corra (lo explica `app.spec.ts`), y `vi.useFakeTimers()` para todo lo que tenga
`setTimeout`.

### Lo que no hay

- **No hay medición de cobertura.** Ni configurada ni en el flujo de trabajo.
- **No hay pruebas de extremo a extremo** (Playwright, Cypress).

## Linter y formato

**angular-eslint** (`npm run lint`), con la configuración en `eslint.config.js`:

- Para TypeScript: las reglas recomendadas de ESLint, de typescript-eslint (recomendadas y
  estilísticas) y de angular-eslint.
- Para las plantillas HTML: las reglas recomendadas y las de **accesibilidad** de
  angular-eslint (`templateAccessibility`), que exigen `alt` en las imágenes, etiquetas en
  los campos, roles válidos, etc.
- Los selectores llevan prefijo `app`: los componentes como elemento en kebab-case
  (`app-menu-bar`) y las directivas como atributo en camelCase (`appReveal`,
  `appFocusTrap`).
- Las variables y argumentos sin usar son error, salvo que empiecen por `_`.

**Prettier** (`npm run format` para escribir, `npm run format:check` para comprobar)
formatea `src/**/*.{ts,html,scss}`, `scripts/*.mjs` y `netlify/**/*.mts`. La
configuración está en el `package.json`:

```json
"printWidth": 100,
"singleQuote": true,
"overrides": [{ "files": "*.html", "options": { "parser": "angular" } }]
```

Instala la extensión de Prettier y activa "Format on Save". No hay un hook de Git que lo
imponga; la integración continua corre el linter, no el formateador.

## Integración continua

`.github/workflows/ci.yml` corre en cada push a `main` y en cada Pull Request, con Node 24
y la aplicación como directorio de trabajo:

1. `npm ci`
2. `npm run lint`
3. `npx ng test --watch=false`
4. `npm run build`

Si cualquiera falla, el Pull Request queda marcado en rojo. El README de la raíz muestra el
badge con el estado de `main`. Netlify no espera a la CI: publica en cuanto llega el push,
así que la CI avisa, pero no bloquea. La protección real sigue siendo no fusionar un PR en
rojo.

## Estilo de código

### Convenciones de nombres

| Cosa | Convención | Ejemplo |
|---|---|---|
| Archivos | kebab-case, **sin sufijo de tipo** | `hero-section.ts`, no `hero-section.component.ts` |
| Clases de componente | PascalCase | `HeroSection`, `MainLayoutComponent` |
| Selectores de componente | prefijo `app-`, kebab-case | `app-hero-section` |
| Selectores de directiva | prefijo `app`, camelCase | `[appReveal]`, `[appFocusTrap]` |
| Clases CSS | prefijo por sección + BEM parcial | `svc-card__title`, `hero-cover__brand` |
| Claves de i18n | camelCase anidado por sección | `contact.form.firstName` |
| Constantes de configuración | MAYÚSCULAS con guión bajo | `CONTACT_ENDPOINT`, `MENU_LINKS` |
| Signals | sustantivo, sin prefijo ni sufijo | `menuOpen`, `state`, `activeId` |

El sufijo de las clases es inconsistente: hay `MainLayoutComponent` y `FooterComponent` pero
también `Navbar`, `Home` y `MenuBar`. Sigue lo que haya en la carpeta donde estés trabajando.

### API de Angular que se usa

- Estado en **signals** (`signal()`, `computed()`), leídas en la plantilla como función:
  `menuOpen()`. Los objetos que `ngModel` escribe directamente (`form`, `code`) son la
  excepción y son propiedades planas.
- **`inject()`** para las dependencias, nunca inyección por constructor.
- **`input()` / `output()`** en directivas y componentes compartidos; `input.required()`
  cuando no tiene sentido un valor por defecto.
- **`@if` / `@for` / `@defer`** en las plantillas. No hay `*ngIf`, `*ngFor` ni
  `CommonModule`.
- `standalone: true` no se escribe: es el valor por defecto.
- Todo lo que toque `window`, `document`, `localStorage` o temporizadores va detrás de
  `isPlatformBrowser(inject(PLATFORM_ID))`, porque el mismo código corre al prerenderizar.

### Idioma del código

**Regla del proyecto: el código en inglés, lo que se lee en español.**

| En inglés | En español |
|---|---|
| Nombres de clases, métodos, archivos | Comentarios |
| Clases CSS | Mensajes de commit |
| Claves de traducción | Textos de la interfaz |
| | Nombres de campos que se envían al servidor (`nombre`, `apellido`, `celular`) |
| | Funciones y variables de la lógica de negocio más reciente (`validarConsulta`, `esNavegador`, `prefiereMenosMovimiento`) |

Las dos últimas filas son la excepción llamativa: la interfaz `ContactRequest` tiene los
campos en español (`nombre`, `descripcion`) porque lo que viaja al correo se lee en español,
y las piezas escritas más recientemente (reglas de contacto, consentimiento del mapa,
scripts) usan nombres en español. No es del todo consistente con el resto; en cada archivo,
sigue el idioma que ya tenga.

### Sobre los comentarios

Esta es la característica más distintiva del proyecto y conviene mantenerla.

**Los comentarios aquí explican por qué, nunca qué.** Ejemplos reales:

```ts
// Cayó en la trampa. Se responde 200 a propósito: si devolviéramos un error,
// el bot sabría que fue detectado y volvería a intentar de otra forma.
```

```html
<!-- `gradientUnits="userSpaceOnUse"`: con el valor por defecto (objectBoundingBox)
     una línea perfectamente horizontal o vertical tiene caja de cero alto o ancho
     y el degradado no se pinta. -->
```

```ts
// El recorte automático de sharp no sirvió aquí: dejaba media foto de
// cielo y la cara abajo del encuadre.
```

Ninguno describe lo que la línea siguiente hace. Todos explican una decisión que, sin el
comentario, alguien "arreglaría" rompiendo algo.

**Cuando escribas código nuevo:** si tomaste una decisión que no es obvia, o que ya fallaste
una vez de otra manera, escríbelo. Si el código sólo hace lo que dice, no lo comentes.

Y hay varios avisos ⚠️ en el código (en `tales.config.ts`, en `contact.config.ts`, en las
plantillas legales, en `netlify.toml`, en `generate-csp.mjs`) que están escritos para que
alguien no rompa algo importante por desconocimiento. **No los borres.**

## Flujo de trabajo con Git

**Rama principal:** `main`. Cada push publica el sitio.

### Flujo recomendado

```bash
git checkout main
git pull
git checkout -b feature/mi-cambio

# … trabajar, con commits pequeños …

npm run lint                     # que el linter pase
npx ng test --watch=false        # que las pruebas pasen
npm run build                    # que compile y prerenderice
git push -u origin feature/mi-cambio
```

Después, un Pull Request en GitHub. La integración continua corre las mismas tres cosas y
**Netlify publica automáticamente una vista previa de cada PR con su propia URL**: úsala
para revisar el cambio de verdad, en un móvil, antes de fusionar.

**No trabajes directo en `main`.** No hay ambiente de pruebas: lo que entra sale al aire en
dos o tres minutos.

### Mensajes de commit

El historial usa el estilo convencional, en español:

```
fix: titulo del navegador como Psyconova
chore: fijar Node 24 en Netlify, igual que el entorno de pruebas
sec: Content Security Policy generada desde el HTML construido
```

| Prefijo | Para qué |
|---|---|
| `feat:` | Funcionalidad nueva |
| `fix:` | Corrección |
| `chore:` | Configuración, dependencias, tareas de mantenimiento |
| `refactor:` | Reorganización sin cambio de comportamiento |
| `docs:` | Documentación |
| `style:` | Sólo formato o estilos visuales |
| `test:` | Pruebas |
| `perf:`, `a11y:`, `sec:`, `priv:` | Rendimiento, accesibilidad, seguridad, privacidad |

Los commits más antiguos están en inglés. **Sigue con el español**, que es lo coherente
con los comentarios del código.

## Revisión de cambios

Qué mirar en un Pull Request de este proyecto en concreto:

**Textos**
- [ ] ¿Se añadió alguna clave de i18n? ¿Está en `es.json` **y** en `en.json`?
- [ ] ¿Hay texto escrito directo en una plantilla que debería estar en i18n?

**Una sola fuente**
- [ ] Si cambió el menú: ¿se cambió en `navigation.config.ts` y no en una plantilla?
- [ ] Si cambió un dato de contacto: ¿se cambió en `contact.config.ts` y no en la plantilla?
- [ ] Si se añadió una página: ¿está en `app.routes.ts` **y** en `PAGES`?

**Formulario y datos**
- [ ] ¿Se añadió un campo? ¿Pasa por `escaparHtml()` en `contact-rules.ts`?
- [ ] ¿Sigue siendo imposible enviar sin marcar el consentimiento?
- [ ] ¿Sigue siendo imposible que se muestre "enviado" si el envío falló?

**Prerenderizado y seguridad**
- [ ] ¿Algo nuevo toca `window`, `document` o temporizadores? ¿Está detrás de `isPlatformBrowser`?
- [ ] ¿Se carga algún recurso externo? ¿Está autorizado en `generate-csp.mjs`? ¿Necesita consentimiento previo?
- [ ] ¿El build sigue diciendo `Prerendered 4 static routes` (o el número nuevo)?

**Estilos**
- [ ] ¿Usa los colores reales de la paleta (ver [04](./04-sistema-de-diseno.md)) y no los
      tokens desactualizados?
- [ ] ¿Respeta el ritmo claro-oscuro de la sección donde va?
- [ ] ¿El acento elegido es el correcto para ese fondo (`#72dfd1` oscuro / `#0f8f84` claro)?
- [ ] ¿La hoja de estilos sigue por debajo de 16 kB?

**Accesibilidad**
- [ ] ¿Los elementos interactivos son `<button>` o `<a href>`, y no `<div (click)>`?
- [ ] ¿Las imágenes tienen `alt`? ¿Lo decorativo tiene `aria-hidden="true"`?
- [ ] ¿Se puede usar sólo con el teclado? ¿Funciona con `prefers-reduced-motion`?

**General**
- [ ] ¿Lint en verde? ¿Compila? ¿Pasan las pruebas?
- [ ] ¿Se revisó en la vista previa, en móvil y en los dos idiomas?
- [ ] ¿Ninguna clave ni dato sensible en el código?

## Deuda técnica reconocida

Recogida aquí para que nadie la descubra por sorpresa.

| Deuda | Dónde | Peso |
|---|---|---|
| Tokens de diseño que no coinciden con los colores usados | `_variables.scss` | Medio |
| Doce puntos de quiebre distintos | Todos los SCSS | Bajo |
| Hoja de estilos por encima del presupuesto de aviso | `cta-section.scss` | Bajo |
| Contraste de `#0f8f84` sobre fondo claro por debajo de WCAG AA | Insignias de las secciones claras | Bajo |
| `@HostListener('window:scroll')` sin limitación | `navbar.ts` | Bajo |
| Sin límite de envíos ni captcha en el formulario | `contact.mts` | Medio |
| Sin cobertura ni pruebas de extremo a extremo | | Medio |
| El idioma no está en la URL (sólo se indexa el español) | Router | Medio |
| Idioma de los identificadores mezclado (inglés y español) | Código reciente | Bajo |

---

**Siguiente:** [12 · Runbook](./12-runbook.md): recetas para las tareas más comunes.

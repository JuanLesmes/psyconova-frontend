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

## Pruebas

**Estado actual: 8 pruebas en 7 archivos.** Todas pasan, y tardan unos 26 segundos.

```bash
npm test                      # modo vigilancia
npx ng test --watch=false     # una vez y termina
```

El sistema es **Vitest sobre jsdom**, a través del constructor `@angular/build:unit-test` de
Angular 21. No hay Karma ni navegador real.

### Qué se prueba hoy

> **📊 GRÁFICO G-28 — Pirámide de pruebas: lo que hay y lo que falta**
> **Va aquí:** debajo de este párrafo.
> **Tipo:** pirámide de pruebas clásica, con tres niveles, pero con el relleno indicando
> qué está cubierto y qué no.
> **Debe mostrar:** que la cobertura actual está mal repartida: no es que haya pocas
> pruebas, es que las que hay no cubren nada de lo que tiene lógica.
> **Niveles:**
> - **Base (unitarias)** — dibuja la banda casi vacía. Dentro, en verde: `App` (2 pruebas,
>   con contenido real). En gris: 6 pruebas "should create" autogeneradas, tres de ellas
>   sobre componentes vacíos.
> - **Medio (integración)** — vacío por completo.
> - **Cima (extremo a extremo)** — vacío por completo.
> **Al lado derecho, una lista en rojo etiquetada "sin ninguna prueba":**
> `LanguageService` · `isValidTaleCode` / `normalizeCode` · `CtaSection.onSubmit` ·
> `ContactService` · `RevealDirective` · la función serverless `contact.mts`.
> **Anota:** "Las cuatro primeras son la lógica real del proyecto. Son también las más
> fáciles de probar: funciones puras o clases sin dependencias del DOM."

| Archivo | Pruebas | Valor real |
|---|---|---|
| `app.spec.ts` | 2 | ✅ Comprueba que la app arranca y que la pantalla de carga se pinta |
| `home.spec.ts` | 1 | ⚠️ Sólo "se puede crear" |
| `about.spec.ts` | 1 | ❌ Sobre un componente vacío |
| `services.spec.ts` | 1 | ❌ Sobre un componente vacío |
| `contact.spec.ts` | 1 | ❌ Sobre un componente vacío |
| `primary-button.spec.ts` | 1 | ❌ Sobre un componente vacío |
| `section-title.spec.ts` | 1 | ❌ Sobre un componente vacío |

Seis de las ocho son plantillas autogeneradas por Angular CLI que comprueban que un
componente se puede instanciar. **No detectarían ninguna regresión real.**

Sólo `app.spec.ts` está escrito a mano, y se nota: tiene un comentario explicando la decisión
de no usar el cargador de traducciones (*"Sin loader: el pipe devuelve la clave, suficiente
para montar el componente"*).

### Lo que debería probarse

Ordenado por relación entre valor y esfuerzo:

**1. `isValidTaleCode()` y `normalizeCode()`** — Son funciones puras, sin dependencias. La
prueba es trivial y cubre lógica de verdad:

```ts
import { isValidTaleCode, normalizeCode } from './tales.config';

describe('isValidTaleCode', () => {
  it('acepta la palabra exacta', () => {
    expect(isValidTaleCode('manada')).toBe(true);
  });

  it('acepta variaciones de mayúsculas, tildes y espacios', () => {
    expect(isValidTaleCode('  MANÁDA ')).toBe(true);
    expect(isValidTaleCode('Las   Manadas')).toBe(true);
  });

  it('rechaza cualquier otra cosa', () => {
    expect(isValidTaleCode('')).toBe(false);
    expect(isValidTaleCode('lobo')).toBe(false);
  });
});
```

**2. `LanguageService`** — La cadena de decisión del idioma inicial (guardado → navegador →
español) tiene varios caminos y ninguno está probado. Hay que simular `localStorage` y
`navigator.language`, incluido el caso en que `localStorage` lanza excepción.

**3. `CtaSection.onSubmit()`** — Con un `ContactService` simulado, comprobar que: no envía sin
consentimiento, pasa a `sending` al enviar, pasa a `success` y limpia el formulario si el
servicio responde bien, y **pasa a `error` sin limpiar nada si falla**. Ese último es el
comportamiento más importante del sitio y hoy nada lo protege.

**4. La función serverless** — Es una función que recibe un `Request` y devuelve un
`Response`; se puede probar sin Netlify. Los casos clave: el campo trampa responde 200 sin
enviar, faltan campos → 400, correo inválido → 400, sin consentimiento → 400, sin clave →
500.

### Cómo escribir una prueba de componente

El patrón está en `app.spec.ts`. Lo esencial es que **casi cualquier componente de este
proyecto necesita al menos el servicio de traducción**, y muchos también el router:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

await TestBed.configureTestingModule({
  imports: [MiComponente],
  providers: [
    provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
    provideRouter([]),
  ],
}).compileComponents();
```

Sin cargador de traducciones, el pipe `translate` devuelve la clave literal. Para casi
cualquier prueba eso basta y evita tener que simular peticiones HTTP.

### Lo que no hay

- **No hay medición de cobertura.** Ni configurada ni en el flujo de trabajo.
- **No hay pruebas de extremo a extremo** (Playwright, Cypress).
- **No hay integración continua.** Nadie corre las pruebas automáticamente; Netlify sólo
  compila. Una prueba rota puede llegar a producción sin que nada avise.

Añadir un flujo de GitHub Actions que corra `npm run build` y `npx ng test --watch=false` en
cada Pull Request es media hora de trabajo y cambia bastante las cosas. Es la propuesta P-12.

## Estilo de código

### Convenciones de nombres

| Cosa | Convención | Ejemplo |
|---|---|---|
| Archivos | kebab-case, **sin sufijo de tipo** | `hero-section.ts`, no `hero-section.component.ts` |
| Clases de componente | PascalCase | `HeroSection`, `MainLayoutComponent` |
| Selectores | prefijo `app-` | `app-hero-section` |
| Clases CSS | prefijo por sección + BEM parcial | `svc-card__title`, `hero-cover__brand` |
| Claves de i18n | camelCase anidado por sección | `contact.form.firstName` |
| Constantes de configuración | MAYÚSCULAS con guión bajo | `CONTACT_ENDPOINT`, `CRISIS_LINES` |

El sufijo de las clases es inconsistente: hay `MainLayoutComponent` y `FooterComponent` pero
también `Navbar` y `Home`. Sigue lo que haya en la carpeta donde estés trabajando.

### Idioma del código

**Regla del proyecto: el código en inglés, lo que se lee en español.**

| En inglés | En español |
|---|---|
| Nombres de clases, métodos, archivos | Comentarios |
| Clases CSS | Mensajes de commit |
| Claves de traducción | Textos de la interfaz |
| | Nombres de campos que se envían al servidor (`nombre`, `apellido`, `celular`) |

Esa última fila es una excepción llamativa: la interfaz `ContactRequest` tiene los campos en
español (`nombre`, `descripcion`) porque lo que viaja al correo se lee en español. Es
deliberado y consistente en las tres capas (componente, servicio, función serverless).

### Sobre los comentarios

Esta es la característica más distintiva del proyecto y conviene mantenerla.

**Los comentarios aquí explican por qué, nunca qué.** Ejemplos reales:

```ts
// Trampa para bots. Se responde 200 a propósito: si devolviéramos un error,
// el bot sabría que fue detectado y volvería a intentar de otra forma.
```

```scss
/* gradientUnits="userSpaceOnUse" fixes invisible lines on perfectly
   horizontal or vertical paths (objectBoundingBox has zero dimension). */
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
plantillas legales) que están escritos para que alguien no rompa algo importante por
desconocimiento. **No los borres.**

### Formato

Prettier configurado en el `package.json`:

```json
"printWidth": 100,
"singleQuote": true,
"overrides": [{ "files": "*.html", "options": { "parser": "angular" } }]
```

Instala la extensión de Prettier y activa "Format on Save". **No hay nada que lo imponga**,
así que es responsabilidad de cada quien.

## Flujo de trabajo con Git

> **📊 GRÁFICO G-27 — Flujo de trabajo con Git**
> **Va aquí:** debajo de este párrafo.
> **Tipo:** diagrama de ramas de Git, horizontal.
> **Debe mostrar:** el flujo recomendado, y en qué punto exacto el cambio se vuelve público.
> **Contenido:**
> - Línea `main` horizontal, con commits.
> - Una rama `feature/mi-cambio` que sale de `main`, tiene dos o tres commits y vuelve.
> - En el punto de salida: "`git checkout -b feature/…`".
> - Sobre la rama: "commits pequeños, en español, con prefijo".
> - En el punto de retorno: "Pull Request → **Netlify publica una vista previa con una URL
>   propia** → revisar ahí → fusionar".
> - **Marca en rojo el punto de fusión con `main`** y la etiqueta: "**aquí sale al aire**.
>   No hay ambiente de pruebas ni aprobación manual: en 2-3 minutos está publicado."
> **Añade abajo, tachado en rojo:** una flecha directa de "tu máquina" a `main` con la
> etiqueta "no hagas esto".

**Repositorio:** `github.com/Inti-Nova/psyconova-frontend`
**Rama principal:** `main` — cada push publica el sitio.

Hoy existe también `feature/landing-home-base`, del desarrollo inicial.

### Flujo recomendado

```bash
git checkout main
git pull
git checkout -b feature/mi-cambio

# … trabajar, con commits pequeños …

npm run build                    # que compile
npx ng test --watch=false        # que las pruebas pasen
git push -u origin feature/mi-cambio
```

Después, un Pull Request en GitHub. **Netlify publica automáticamente una vista previa de
cada PR con su propia URL**: úsala para revisar el cambio de verdad, en un móvil, antes de
fusionar. Es la herramienta más valiosa que el proyecto ya tiene y menos se aprovecha.

**No trabajes directo en `main`.** No hay ambiente de pruebas: lo que entra sale al aire.

### Mensajes de commit

El historial usa el estilo convencional, en español:

```
fix: titulo del navegador como Psyconova
chore: fijar Node 24 en Netlify, igual que el entorno de pruebas
feat: enhance footer and team section with new styles and structure
```

| Prefijo | Para qué |
|---|---|
| `feat:` | Funcionalidad nueva |
| `fix:` | Corrección |
| `chore:` | Configuración, dependencias, tareas de mantenimiento |
| `refactor:` | Reorganización sin cambio de comportamiento |
| `docs:` | Documentación |
| `style:` | Sólo formato o estilos visuales |

Los últimos commits están en español y los anteriores en inglés. **Sigue con el español**,
que es lo más reciente y lo coherente con los comentarios del código.

## Revisión de cambios

Qué mirar en un Pull Request de este proyecto en concreto:

**Textos**
- [ ] ¿Se añadió alguna clave de i18n? ¿Está en `es.json` **y** en `en.json`?
- [ ] ¿Hay texto escrito directo en una plantilla que debería estar en i18n?

**Duplicación conocida**
- [ ] Si cambió el menú: ¿se cambió en `navbar.html` **y** en `hero-section.html`?
- [ ] Si cambió un dato de contacto: ¿se cambió en `contact.config.ts` y no en la plantilla?

**Formulario y datos**
- [ ] ¿Se añadió un campo? ¿Pasa por `escapar()` en la función serverless?
- [ ] ¿Sigue siendo imposible enviar sin marcar el consentimiento?
- [ ] ¿Sigue siendo imposible que se muestre "enviado" si el envío falló?

**Estilos**
- [ ] ¿Usa los colores reales de la paleta (ver [04](./04-sistema-de-diseno.md)) y no los
      tokens desactualizados?
- [ ] ¿Respeta el ritmo claro-oscuro de la sección donde va?
- [ ] ¿El acento elegido es el correcto para ese fondo (`#72dfd1` oscuro / `#0f8f84` claro)?
- [ ] ¿La hoja de estilos sigue por debajo de 16 kB?

**Accesibilidad**
- [ ] ¿Los elementos interactivos son `<button>` o `<a href>`, y no `<div (click)>`?
- [ ] ¿Las imágenes tienen `alt`? ¿Lo decorativo tiene `aria-hidden="true"`?
- [ ] ¿Se puede usar sólo con el teclado?

**General**
- [ ] ¿Compila? ¿Pasan las pruebas?
- [ ] ¿Se revisó en móvil y en los dos idiomas?
- [ ] ¿Ninguna clave ni dato sensible en el código?

## Deuda técnica reconocida

Recogida aquí para que nadie la descubra por sorpresa. El detalle y la priorización están en
[PROPUESTAS.md](./PROPUESTAS.md).

| Deuda | Dónde | Peso |
|---|---|---|
| Rutas vacías accesibles públicamente | `features/{about,services,contact}/` | Alto |
| Tokens de diseño que no coinciden con los colores usados | `_variables.scss` | Medio |
| Menú duplicado entre navbar y hero | `navbar.html`, `hero-section.html` | Medio |
| Ancla `#intro` inexistente en el menú | `navbar.html`, `hero-section.html` | Bajo |
| Enlaces sin `href`, no accesibles por teclado | `navbar.html`, `hero-section.html` | Medio |
| Sin `prefers-reduced-motion` | Todo el CSS | Medio |
| Doce puntos de quiebre distintos | Todos los SCSS | Bajo |
| Componentes vacíos que nadie usa | `shared/components/` | Bajo |
| Pruebas sin valor real | 6 de los 7 `.spec.ts` | Medio |
| Sin integración continua | — | Medio |
| `ngIf`/`ngFor` en vez de `@if`/`@for` | Todas las plantillas | Bajo |
| Hoja de estilos por encima del presupuesto | `cta-section.scss` | Bajo |
| Favicon de 124 KB con `sizes` inválido | `index.html` | Bajo |

---

**Siguiente:** [12 · Runbook](./12-runbook.md) — recetas para las tareas más comunes.

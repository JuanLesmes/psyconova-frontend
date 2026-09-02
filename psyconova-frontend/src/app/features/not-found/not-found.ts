import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { PAGES } from '../../core/config/site.config';

/**
 * Página para direcciones que no existen.
 *
 * ── Por qué tiene su propia ruta /404 además del comodín ──
 *
 * El comodín `**` no se puede enumerar, así que el prerenderizado no lo puede
 * generar. La ruta concreta /404 sí, y de ahí sale el archivo 404.html que
 * Netlify sirve —con código 404 de verdad— para cualquier dirección que no
 * corresponda a un archivo.
 *
 * El comodín se queda para la navegación interna: si alguien ya está en el
 * sitio y sigue un enlace roto, el router pinta esta misma página sin recargar.
 *
 * Va marcada `noindex`: es una página de error, no contenido. Y por eso queda
 * fuera del sitemap, que sólo lista las páginas indexables.
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.apply(PAGES.notFound);
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { PAGES } from '../../core/config/site.config';

/**
 * Página para direcciones que no existen.
 *
 * Tiene su propia ruta /404 además del comodín porque `**` no se puede
 * enumerar y el prerenderizado no lo genera; de /404 sale el 404.html que
 * Netlify sirve, con código 404 de verdad, para cualquier dirección sin
 * archivo. El comodín se queda para la navegación interna: un enlace roto
 * dentro del sitio pinta esta página sin recargar. Va con `noindex`, y por
 * eso queda fuera del sitemap, que sólo lista las páginas indexables.
 */
@Component({
  selector: 'app-not-found',
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

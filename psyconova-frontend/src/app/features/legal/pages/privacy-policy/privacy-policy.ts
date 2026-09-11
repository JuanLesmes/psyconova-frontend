import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { PAGES } from '../../../../core/config/site.config';

/**
 * Política de tratamiento de datos personales.
 *
 * El texto va directo en la plantilla y no en los archivos de traducción: es
 * un documento legal regido por la ley colombiana, así que su versión
 * vinculante es la española. Traducirlo crearía dos textos que podrían
 * decir cosas distintas.
 */
@Component({
  selector: 'app-privacy-policy',
  imports: [RouterLink],
  templateUrl: './privacy-policy.html',
  styleUrl: '../../legal.scss',
})
export class PrivacyPolicy implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.apply(PAGES.privacy);
  }
}

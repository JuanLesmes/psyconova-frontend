import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { PAGES } from '../../../../core/config/site.config';

/** Términos de uso. Ver la nota sobre el idioma en PrivacyPolicy. */
@Component({
  selector: 'app-terms-of-use',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './terms-of-use.html',
  styleUrl: '../../legal.scss',
})
export class TermsOfUse implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.apply(PAGES.terms);
  }
}

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Términos de uso. Ver la nota sobre el idioma en PrivacyPolicy. */
@Component({
  selector: 'app-terms-of-use',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './terms-of-use.html',
  styleUrl: '../../legal.scss',
})
export class TermsOfUse {}

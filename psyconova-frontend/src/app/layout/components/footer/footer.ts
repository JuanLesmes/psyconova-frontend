import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { CONTACT_INFO } from '../../../core/config/contact.config';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, RevealDirective, TranslatePipe],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class FooterComponent {
  readonly contactInfo = CONTACT_INFO;
}

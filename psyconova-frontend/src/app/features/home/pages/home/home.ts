import { Component, OnInit, inject } from '@angular/core';
import { HeroSection } from '../../components/hero-section/hero-section';
import { IntroSection } from '../../components/intro-section/intro-section';
import { ServicesSection } from '../../components/services-section/services-section';
import { StoriesSection } from '../../components/stories-section/stories-section';
import { TeamSection } from '../../components/team-section/team-section';
import { CtaSection } from '../../components/cta-section/cta-section';
import { SeoService } from '../../../../core/services/seo.service';
import { PAGES, SITE, absoluteUrl } from '../../../../core/config/site.config';
import { CONTACT_INFO, LOCATION } from '../../../../core/config/contact.config';

@Component({
  selector: 'app-home',
  imports: [
    HeroSection,
    IntroSection,
    ServicesSection,
    StoriesSection,
    TeamSection,
    CtaSection,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.apply(PAGES.home);

    /**
     * Ficha del negocio para la búsqueda local.
     *
     * Los datos salen de contact.config.ts, que es de donde también los toma
     * la sección de contacto: si cambia la dirección, cambia en los dos sitios
     * a la vez y no queda una ficha apuntando a un consultorio antiguo.
     *
     * `MedicalBusiness` y no `LocalBusiness` a secas porque describe una
     * consulta de psicología clínica, y es lo que permite que aparezcan el
     * área de atención y la especialidad.
     */
    this.seo.setBusinessData({
      '@context': 'https://schema.org',
      '@type': 'MedicalBusiness',
      name: SITE.name,
      url: absoluteUrl(PAGES.home.path),
      logo: `${SITE.url}/assets/images/branding/logoClaroConLetrasSinFondo.webp`,
      image: `${SITE.url}/${SITE.socialImage}`,
      description: PAGES.home.description,
      email: CONTACT_INFO.email,
      telephone: CONTACT_INFO.whatsapp,
      medicalSpecialty: 'Psychiatric',
      address: {
        '@type': 'PostalAddress',
        streetAddress: `${LOCATION.street}, ${LOCATION.building}`,
        addressLocality: 'Bogotá',
        addressCountry: 'CO',
      },
      areaServed: {
        '@type': 'City',
        name: 'Bogotá',
      },
      founder: {
        '@type': 'Person',
        name: 'Laura Valentina Lesmes Castañeda',
        jobTitle: 'Psicóloga Clínica y de la Salud',
      },
    });
  }
}

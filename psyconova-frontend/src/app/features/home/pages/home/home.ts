import { Component } from '@angular/core';
import { HeroSection } from '../../components/hero-section/hero-section';
import { IntroSection } from '../../components/intro-section/intro-section';
import { ServicesSection } from '../../components/services-section/services-section';
import { TeamSection } from '../../components/team-section/team-section';
import { CtaSection } from '../../components/cta-section/cta-section';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroSection,
    IntroSection,
    ServicesSection,
    TeamSection,
    CtaSection,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}

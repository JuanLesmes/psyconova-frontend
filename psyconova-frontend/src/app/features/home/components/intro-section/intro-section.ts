import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-intro-section',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './intro-section.html',
  styleUrl: './intro-section.scss',
})
export class IntroSection {}
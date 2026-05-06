import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';

interface ContactForm {
  nombre: string;
  apellido: string;
  celular: string;
  correo: string;
  descripcion: string;
}

@Component({
  selector: 'app-cta-section',
  standalone: true,
  imports: [CommonModule, FormsModule, RevealDirective],
  templateUrl: './cta-section.html',
  styleUrl: './cta-section.scss',
})
export class CtaSection {
  submitted = false;

  form: ContactForm = {
    nombre: '',
    apellido: '',
    celular: '',
    correo: '',
    descripcion: '',
  };

  onSubmit(): void {
    this.submitted = true;
    setTimeout(() => (this.submitted = false), 5000);
    this.form = { nombre: '', apellido: '', celular: '', correo: '', descripcion: '' };
  }
}

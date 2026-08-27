import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  standalone: true,
  imports: [RouterLink],
  templateUrl: './privacy-policy.html',
  styleUrl: '../../legal.scss',
})
export class PrivacyPolicy {}

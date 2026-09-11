import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Navbar } from '../components/navbar/navbar';
import { FooterComponent } from '../components/footer/footer';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Navbar, FooterComponent, TranslatePipe],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayoutComponent {}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './loading-screen.html',
  styleUrl: './loading-screen.scss',
})
export class LoadingScreen implements OnInit, OnDestroy {
  visible = true;
  hiding = false;

  private hideTimer?: ReturnType<typeof setTimeout>;
  private removeTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.hideTimer = setTimeout(() => {
      this.hiding = true;
      this.removeTimer = setTimeout(() => {
        this.visible = false;
      }, 700);
    }, 2400);
  }

  ngOnDestroy(): void {
    clearTimeout(this.hideTimer);
    clearTimeout(this.removeTimer);
  }
}

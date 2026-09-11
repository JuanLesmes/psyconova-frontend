import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { Home } from './home';
import { instalarIntersectionObserverFalso } from '../../../../testing/intersection-observer.stub';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    instalarIntersectionObserverFalso();

    await TestBed.configureTestingModule({
      imports: [Home],
      // Sin loader: el pipe devuelve la clave, suficiente para montar el componente.
      providers: [
        provideRouter([]),
        provideTranslateService({ fallbackLang: 'es', lang: 'es' })
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

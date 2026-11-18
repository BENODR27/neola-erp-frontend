import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SecondNavbarComponent } from './second-navbar.component';

describe('SecondNavbarComponent', () => {
  let component: SecondNavbarComponent;
  let fixture: ComponentFixture<SecondNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecondNavbarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SecondNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

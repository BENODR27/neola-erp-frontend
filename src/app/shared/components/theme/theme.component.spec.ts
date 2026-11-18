import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { ApiService } from '../../services/api/api.service';

import { ThemeComponent } from './theme.component';

describe('ThemeComponent', () => {
  let component: ThemeComponent;
  let fixture: ComponentFixture<ThemeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(null),
            isAuthenticated: () => false,
            hasPermission: () => false,
          },
        },
        { provide: ApiService, useValue: { getDatas: () => of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

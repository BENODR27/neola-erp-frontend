import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangePalletComponent } from './change-pallet.component';

describe('ChangePalletComponent', () => {
  let component: ChangePalletComponent;
  let fixture: ComponentFixture<ChangePalletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangePalletComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangePalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

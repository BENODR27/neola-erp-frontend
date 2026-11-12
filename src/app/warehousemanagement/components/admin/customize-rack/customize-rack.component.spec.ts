import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomizeRackComponent } from './customize-rack.component';

describe('CustomizeRackComponent', () => {
  let component: CustomizeRackComponent;
  let fixture: ComponentFixture<CustomizeRackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomizeRackComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomizeRackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

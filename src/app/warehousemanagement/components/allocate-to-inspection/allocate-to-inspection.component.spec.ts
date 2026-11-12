import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllocateToInspectionComponent } from './allocate-to-inspection.component';

describe('AllocateToInspectionComponent', () => {
  let component: AllocateToInspectionComponent;
  let fixture: ComponentFixture<AllocateToInspectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllocateToInspectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllocateToInspectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OcReallocationTriggerComponent } from './oc-reallocation-trigger.component';

describe('OcReallocationTriggerComponent', () => {
  let component: OcReallocationTriggerComponent;
  let fixture: ComponentFixture<OcReallocationTriggerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OcReallocationTriggerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OcReallocationTriggerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

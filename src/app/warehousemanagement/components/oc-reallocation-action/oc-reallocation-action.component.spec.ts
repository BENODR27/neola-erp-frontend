import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OcReallocationActionComponent } from './oc-reallocation-action.component';

describe('OcReallocationActionComponent', () => {
  let component: OcReallocationActionComponent;
  let fixture: ComponentFixture<OcReallocationActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OcReallocationActionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OcReallocationActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

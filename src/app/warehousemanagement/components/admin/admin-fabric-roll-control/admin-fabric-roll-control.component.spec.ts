import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminFabricRollControlComponent } from './admin-fabric-roll-control.component';

describe('AdminFabricRollControlComponent', () => {
  let component: AdminFabricRollControlComponent;
  let fixture: ComponentFixture<AdminFabricRollControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminFabricRollControlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminFabricRollControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

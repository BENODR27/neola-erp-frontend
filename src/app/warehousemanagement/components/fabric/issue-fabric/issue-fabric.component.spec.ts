import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueFabricComponent } from './issue-fabric.component';

describe('IssueFabricComponent', () => {
  let component: IssueFabricComponent;
  let fixture: ComponentFixture<IssueFabricComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueFabricComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssueFabricComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

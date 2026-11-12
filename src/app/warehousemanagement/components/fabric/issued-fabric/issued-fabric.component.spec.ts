import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssuedFabricComponent } from './issued-fabric.component';

describe('IssuedFabricComponent', () => {
  let component: IssuedFabricComponent;
  let fixture: ComponentFixture<IssuedFabricComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssuedFabricComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssuedFabricComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

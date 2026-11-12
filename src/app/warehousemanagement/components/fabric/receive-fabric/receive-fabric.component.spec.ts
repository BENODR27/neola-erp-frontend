import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiveFabricComponent } from './receive-fabric.component';

describe('ReceiveFabricComponent', () => {
  let component: ReceiveFabricComponent;
  let fixture: ComponentFixture<ReceiveFabricComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiveFabricComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiveFabricComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

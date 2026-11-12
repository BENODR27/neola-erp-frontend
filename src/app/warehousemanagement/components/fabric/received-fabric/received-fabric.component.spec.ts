import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceivedFabricComponent } from './received-fabric.component';

describe('ReceivedFabricComponent', () => {
  let component: ReceivedFabricComponent;
  let fixture: ComponentFixture<ReceivedFabricComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceivedFabricComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceivedFabricComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

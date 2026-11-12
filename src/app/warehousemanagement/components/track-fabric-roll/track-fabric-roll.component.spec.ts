import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackFabricRollComponent } from './track-fabric-roll.component';

describe('TrackFabricRollComponent', () => {
  let component: TrackFabricRollComponent;
  let fixture: ComponentFixture<TrackFabricRollComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackFabricRollComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackFabricRollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

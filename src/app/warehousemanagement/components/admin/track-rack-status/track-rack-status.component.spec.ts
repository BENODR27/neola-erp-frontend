import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackRackStatusComponent } from './track-rack-status.component';

describe('TrackRackStatusComponent', () => {
  let component: TrackRackStatusComponent;
  let fixture: ComponentFixture<TrackRackStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackRackStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackRackStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

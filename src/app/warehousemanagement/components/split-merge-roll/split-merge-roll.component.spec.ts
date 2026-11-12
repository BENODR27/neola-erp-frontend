import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitMergeRollComponent } from './split-merge-roll.component';

describe('SplitMergeRollComponent', () => {
  let component: SplitMergeRollComponent;
  let fixture: ComponentFixture<SplitMergeRollComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitMergeRollComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SplitMergeRollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

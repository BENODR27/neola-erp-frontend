import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchIssuingComponent } from './batch-issuing.component';

describe('BatchIssuingComponent', () => {
  let component: BatchIssuingComponent;
  let fixture: ComponentFixture<BatchIssuingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchIssuingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BatchIssuingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

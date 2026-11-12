import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchReceiveComponent } from './batch-receive.component';

describe('BatchReceiveComponent', () => {
  let component: BatchReceiveComponent;
  let fixture: ComponentFixture<BatchReceiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchReceiveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BatchReceiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

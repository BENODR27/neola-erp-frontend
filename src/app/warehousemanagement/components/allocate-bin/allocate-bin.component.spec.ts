import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllocateBinComponent } from './allocate-bin.component';

describe('AllocateBinComponent', () => {
  let component: AllocateBinComponent;
  let fixture: ComponentFixture<AllocateBinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllocateBinComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllocateBinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

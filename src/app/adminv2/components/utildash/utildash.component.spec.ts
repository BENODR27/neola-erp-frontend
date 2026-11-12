import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UtildashComponent } from './utildash.component';

describe('UtildashComponent', () => {
  let component: UtildashComponent;
  let fixture: ComponentFixture<UtildashComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UtildashComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UtildashComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

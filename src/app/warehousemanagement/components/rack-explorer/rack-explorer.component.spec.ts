import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RackExplorerComponent } from './rack-explorer.component';

describe('RackExplorerComponent', () => {
  let component: RackExplorerComponent;
  let fixture: ComponentFixture<RackExplorerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RackExplorerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RackExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

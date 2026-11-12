import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FabricFinderComponent } from './fabric-finder.component';

describe('FabricFinderComponent', () => {
  let component: FabricFinderComponent;
  let fixture: ComponentFixture<FabricFinderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FabricFinderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FabricFinderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

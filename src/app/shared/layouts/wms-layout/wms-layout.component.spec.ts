import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WmsLayoutComponent } from './wms-layout.component';

describe('WmsLayoutComponent', () => {
  let component: WmsLayoutComponent;
  let fixture: ComponentFixture<WmsLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WmsLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WmsLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

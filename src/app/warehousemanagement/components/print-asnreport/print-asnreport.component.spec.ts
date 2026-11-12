import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintASNReportComponent } from './print-asnreport.component';

describe('PrintASNReportComponent', () => {
  let component: PrintASNReportComponent;
  let fixture: ComponentFixture<PrintASNReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintASNReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrintASNReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

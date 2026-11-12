import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateSourcingAsnReportComponent } from './generate-sourcing-asn-report.component';

describe('GenerateSourcingAsnReportComponent', () => {
  let component: GenerateSourcingAsnReportComponent;
  let fixture: ComponentFixture<GenerateSourcingAsnReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerateSourcingAsnReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenerateSourcingAsnReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

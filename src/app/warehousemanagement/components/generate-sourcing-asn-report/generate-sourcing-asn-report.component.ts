import { Component , signal} from '@angular/core';
import { TableUtil } from '../../../shared/utils/table-util';
import { ApiService } from '../../../shared/services/api/api.service';
import { WMS_API_CONSTANTS as WAC } from '../../constants/wms-api.constants';
import { NotificationService } from '../../../shared/services/notification/notification.service';

@Component({
  selector: 'app-generate-sourcing-asn-report',
  standalone: false,
  templateUrl: './generate-sourcing-asn-report.component.html',
  styleUrl: './generate-sourcing-asn-report.component.css',
})
export class GenerateSourcingAsnReportComponent {
  readonly sourcingAsnDetails = signal<any[]>([]) // To hold the response data
  readonly dataFetched = signal<boolean>(false) // Flag to track if data has been fetched
  invoiceId: string = ''; // To hold the input Invoice ID

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {}

  fetchSourcingAsnDetails(): void {
    if (!this.invoiceId) {
      this.notificationService.info('Info', 'Enter Invoice No');
    } else {
      this.apiService
        .getDatasByFilter(
          '?InvoiceNo=' + this.invoiceId,
          WAC.API_URL + WAC.sourcingAsnDetail
        )
        .subscribe((response) => {
          if (response.result.length > 0) {
            this.notificationService.success(
              'Good job!',
              'Report Generated Successfully!'
            );
            this.sourcingAsnDetails.set(response.result);
            this.dataFetched.set(true);
          } else {
            this.notificationService.error('No Results', 'No Data Found!');
            this.sourcingAsnDetails.set([]);
            this.dataFetched.set(false);
          }
        });
    }
  }

  exportTable(): void {
    if (this.sourcingAsnDetails().length > 0) {
      TableUtil.exportTableToExcel('sourcingAsnTable', 'SourcingAsnReport');
      this.notificationService.success(
        'Good job!',
        'Report Downloaded Successfully!'
      );
    } else {
      this.notificationService.error('No Results', 'No Data to Download!');
    }
  }
  printDiv() {
    setTimeout(() => {
      const printContents =
        document.getElementById('print-container')?.innerHTML;
      if (printContents) {
        const popupWin = window.open('', '_blank', 'width=800,height=600');
        popupWin?.document.open();
        popupWin?.document.write(`
          <html>
            <head>
              <title>Print</title>
              <style>
                @media print {
                  .page-break {
                    page-break-after: always;
                  }
                }
                qrcode {
                  display: block;
                  margin-bottom: 20px;
                }
              </style>
            </head>
            <body onload="window.print();window.close()">
              ${printContents}
            </body>
          </html>
        `);
        popupWin?.document.close();
      }
    }, 1000); // Delay of 500ms to ensure QR code rendering
  }
}

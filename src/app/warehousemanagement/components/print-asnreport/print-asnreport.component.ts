import { Component , signal} from '@angular/core';
import { ApiService } from '../../../shared/services/api/api.service';
import { WMS_API_CONSTANTS as WAC } from '../../constants/wms-api.constants';
import { NotificationService } from '../../../shared/services/notification/notification.service';

@Component({
  selector: 'app-print-asnreport',
  standalone: false,
  templateUrl: './print-asnreport.component.html',
  styleUrl: './print-asnreport.component.css',
})
export class PrintASNReportComponent {
  readonly sourcingAsnDetails = signal<any[]>([]) // To hold the response data
  dataFetched: boolean = false; // Flag to track if data has been fetched
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
            this.dataFetched = true;
          } else {
            this.notificationService.error('No Results', 'No Data Found!');
          }
        });
    }
  }

  printDiv() {
    if (this.sourcingAsnDetails().length > 0) {
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
                  body {
                    margin: 0;
                    padding: 0;
                    width: 210mm;
                    height: 297mm;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                  }
                  .content-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: space-evenly;
                    text-align: start;
                    padding: 10mm;
                    box-sizing: border-box;
                  }
                  .qr-container {
                    flex-grow: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 20px;
                  }
                  qrcode img {
                    width: 500px; /* Increased QR code size */
                    height: 500px; /* Increased QR code size */
                  }
                  .details-container {
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: start;
                    justify-content: start;
                    text-align: start;
                    font-size: 24px; /* Increased text size */
                  }
                  .details-container p {
                    margin: 4px 0;
                  }
                }
              </style>
            </head>
            <body onload="window.print();window.close()">
              <div class="content-container">
                ${printContents}
              </div>
            </body>
          </html>
           `);
          popupWin?.document.close();
        }
      }, 1000);
    } else {
      this.notificationService.info('Info', 'No Data To Print');
    }
  }
}

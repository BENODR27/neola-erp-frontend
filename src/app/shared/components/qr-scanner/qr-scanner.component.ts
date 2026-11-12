import { Component, EventEmitter, Output } from '@angular/core';
import { BarcodeFormat } from '@zxing/browser';
import { ZXingScannerModule } from '@zxing/ngx-scanner'; // Import ZXingScannerModule

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [ZXingScannerModule],
  templateUrl: './qr-scanner.component.html',
  styleUrl: './qr-scanner.component.css',
})
export class QrScannerComponent {
  formats: BarcodeFormat[] = [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.CODE_128,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
  ]; // Use BarcodeFormat enum

  @Output() scanSuccess = new EventEmitter<string>();

  onScanSuccess(data: string): void {
    this.playSuccessSound();
    this.scanSuccess.emit(data);
  }
  private playSuccessSound(): void {
    const audio = new Audio('/scansound.wav'); // Update the path if needed
    audio.play();
  }
}
// 'CODE_128', 'EAN', 'QR_CODE'

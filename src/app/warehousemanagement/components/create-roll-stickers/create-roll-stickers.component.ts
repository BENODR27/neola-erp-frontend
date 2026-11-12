import { Component , signal} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import jsPDF from 'jspdf';
import { NotificationService } from '../../../shared/services/notification/notification.service';

interface RollSticker {
  rollIndex: number;
  rollId: string;
  invoiceNo: string;
  supplierName: string;
  ocNo: string;
  poNo: string;
  fabricRef: string;
  styleName: string;
  colorName: string;
  totalQty: number | null;
  qrData: string;
}

type StickerField =
  | 'invoiceNo'
  | 'supplierName'
  | 'ocNo'
  | 'poNo'
  | 'fabricRef'
  | 'styleName'
  | 'colorName'
  | 'totalQty';

type StickerRow = { rollIndex: number } & Record<
  StickerField,
  string | number | null
>;

@Component({
  selector: 'app-create-roll-stickers',
  standalone: false,
  templateUrl: './create-roll-stickers.component.html',
  styleUrl: './create-roll-stickers.component.css',
})
export class CreateRollStickersComponent {
  readonly isDownloading = signal(false)
  readonly isTableView = signal(false)
  readonly sharedFields: Array<{ key: StickerField; label: string }> = [
    { key: 'invoiceNo', label: 'Invoice' },
    { key: 'supplierName', label: 'Supplier' },
    { key: 'ocNo', label: 'OC' },
    { key: 'poNo', label: 'PO' },
    { key: 'fabricRef', label: 'Fabric reference' },
    { key: 'styleName', label: 'Style' },
    { key: 'colorName', label: 'Color' },
    { key: 'totalQty', label: 'Quantity' },
  ];
  readonly sameForAll: Record<StickerField, boolean> = {
    invoiceNo: true,
    supplierName: true,
    ocNo: true,
    poNo: true,
    fabricRef: true,
    styleName: true,
    colorName: true,
    totalQty: true,
  };
  readonly rollRows = signal<StickerRow[]>([])
  form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
  ) {
    this.form = this.formBuilder.group({
      shadeLot: ['', Validators.required],
      numberOfRolls: [
        1,
        [
          Validators.required,
          Validators.min(1),
          (control: AbstractControl) =>
            Number.isInteger(Number(control.value))
              ? null
              : { wholeNumber: true },
        ],
      ],
      invoiceNo: [''],
      supplierName: [''],
      ocNo: [''],
      poNo: [''],
      fabricRef: [''],
      styleName: [''],
      colorName: [''],
      totalQty: [null as number | null],
    });
    this.syncRollRows();
  }

  get stickerRows(): RollSticker[] {
    const prefix = String(this.form.get('shadeLot')?.value ?? '').trim();
    return this.rollRows().map((row) => {
      const detail = {} as Record<StickerField, string | number | null>;
      for (const field of this.sharedFields) {
        detail[field.key] = this.sameForAll[field.key]
          ? this.form.get(field.key)?.value
          : row[field.key];
      }
      const rollId = `${prefix}-R${row.rollIndex}`;
      return {
        ...detail,
        rollIndex: row.rollIndex,
        rollId,
        invoiceNo: String(detail.invoiceNo ?? ''),
        supplierName: String(detail.supplierName ?? ''),
        ocNo: String(detail.ocNo ?? ''),
        poNo: String(detail.poNo ?? ''),
        fabricRef: String(detail.fabricRef ?? ''),
        styleName: String(detail.styleName ?? ''),
        colorName: String(detail.colorName ?? ''),
        totalQty:
          detail.totalQty == null || detail.totalQty === ''
            ? null
            : Number(detail.totalQty),
        qrData: [
          rollId,
          detail.ocNo ?? '',
          detail.invoiceNo ?? '',
          detail.supplierName ?? '',
          detail.poNo ?? '',
          detail.fabricRef ?? '',
          detail.styleName ?? '',
          detail.colorName ?? '',
          detail.totalQty ?? '',
        ].join('#$@'),
      };
    });
  }

  get stickers(): RollSticker[] {
    if (!String(this.form.get('shadeLot')?.value ?? '').trim()) {
      return [];
    }
    return this.stickerRows;
  }

  onRollCountChange(): void {
    this.syncRollRows();
  }

  generateTable(): void {
    this.form.get('shadeLot')?.markAsTouched();
    this.form.get('numberOfRolls')?.markAsTouched();
    if (
      this.form.get('shadeLot')?.invalid ||
      this.form.get('numberOfRolls')?.invalid
    ) {
      this.notificationService.info(
        'Complete roll setup',
        'Enter a shade lot and a positive whole number of rolls.',
      );
      return;
    }

    this.syncRollRows();
    this.isTableView.set(true);
  }

  editDetails(): void {
    this.isTableView.set(false);
  }

  setSameForAll(field: StickerField, checked: boolean): void {
    this.sameForAll[field] = checked;
    if (!checked) {
      const commonValue = this.form.get(field)?.value;
      this.rollRows().forEach((row) => {
        row[field] = commonValue;
      });
    }
  }

  updateCommonField(field: StickerField, value: string | number | null): void {
    this.form.get(field)?.setValue(value);
  }

  updateRollField(
    index: number,
    field: StickerField,
    value: string | number | null,
  ): void {
    const row = this.rollRows()[index];
    if (row) {
      row[field] = value;
    }
  }

  rollFieldValue(index: number, field: StickerField): string | number | null {
    if (this.sameForAll[field]) {
      return this.form.get(field)?.value ?? null;
    }
    return this.rollRows()[index]?.[field] ?? null;
  }

  isRollDetailsValid(): boolean {
    return (
      this.stickers.length > 0 &&
      this.stickers.every(
        (sticker) =>
          sticker.invoiceNo.trim().length > 0 &&
          sticker.totalQty != null &&
          Number.isFinite(sticker.totalQty) &&
          sticker.totalQty > 0 &&
          String(sticker.totalQty).trim().length > 0,
      )
    );
  }

  trackByRollIndex(_index: number, sticker: RollSticker): number {
    return sticker.rollIndex;
  }

  downloadStickers(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.isRollDetailsValid()) {
      this.notificationService.info(
        'Complete sticker details',
        'Enter a shade lot and provide an invoice and positive quantity for every roll.',
      );
      return;
    }

    const cards = Array.from(
      document.querySelectorAll<HTMLElement>('#roll-sticker-preview .sticker-card'),
    );
    const images = cards.map((card) =>
      card.querySelector<HTMLImageElement>('qrcode img'),
    );
    if (
      cards.length !== this.stickers.length ||
      images.some(
        (image) => !image || !image.complete || image.naturalWidth === 0,
      )
    ) {
      this.notificationService.error(
        'Download failed',
        'Sticker QR codes are not ready yet. Please try again.',
      );
      return;
    }

    this.isDownloading.set(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [4, 4],
        compress: true,
      });
      this.stickers.forEach((sticker, index) => {
        if (index > 0) {
          pdf.addPage([4, 4], 'portrait');
        }
        this.drawSticker(pdf, sticker, images[index]!.src);
      });
      pdf.save('fabric-roll-stickers-4x4.pdf');
      this.notificationService.success(
        'Downloaded',
        `${this.stickers.length} sticker${this.stickers.length === 1 ? '' : 's'} downloaded.`,
        3000,
      );
    } catch (error) {
      this.notificationService.error(
        'Download failed',
        error instanceof Error
          ? error.message
          : 'Unable to generate the 4 x 4 inch sticker PDF.',
      );
    } finally {
      this.isDownloading.set(false);
    }
  }

  private drawSticker(
    pdf: jsPDF,
    sticker: RollSticker,
    qrImage: string,
  ): void {
    pdf.setTextColor(97, 116, 141);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.text('FABRIC ROLL', 0.22, 0.32);
    pdf.setTextColor(45, 99, 159);
    pdf.text(`ROLL ${sticker.rollId}`, 3.78, 0.32, {
      align: 'right',
      maxWidth: 2.1,
    });
    pdf.setDrawColor(217, 225, 235);
    pdf.line(0.22, 0.46, 3.78, 0.46);

    pdf.setTextColor(29, 53, 87);
    pdf.setFontSize(14);
    pdf.text(sticker.rollId, 2, 0.78, {
      align: 'center',
      maxWidth: 3.5,
    });
    pdf.addImage(qrImage, 'PNG', 1.25, 0.9, 1.5, 1.5);

    const details: Array<[string, string]> = [
      ['Invoice', sticker.invoiceNo || '-'],
      ['Supplier', sticker.supplierName || '-'],
      ['OC / PO', `${sticker.ocNo || '-'} / ${sticker.poNo || '-'}`],
      ['Reference', sticker.fabricRef || '-'],
      ['Style / Color', `${sticker.styleName || '-'} / ${sticker.colorName || '-'}`],
      ['Quantity', String(sticker.totalQty ?? '-')],
    ];
    let y = 2.62;
    details.forEach(([label, value]) => {
      pdf.setFontSize(label === 'Quantity' ? 8 : 7);
      pdf.setTextColor(53, 74, 101);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${label}:`, 0.25, y);
      pdf.setTextColor(39, 56, 78);
      pdf.setFont('helvetica', label === 'Quantity' ? 'bold' : 'normal');
      const lines = pdf.splitTextToSize(value || '-', 2.75);
      pdf.text(lines, 1.15, y);
      y += Math.max(0.19, lines.length * 0.12);
    });
  }

  private syncRollRows(): void {
    const count = Number(this.form.get('numberOfRolls')?.value);
    if (!Number.isInteger(count) || count < 1) {
      this.rollRows.set([]);
      return;
    }

    const common = this.form.getRawValue();
    this.rollRows.set(Array.from({ length: count }, (_, index) => {
      const existing = this.rollRows()[index];
      const row = {
        rollIndex: index + 1,
      } as StickerRow;
      for (const field of this.sharedFields) {
        row[field.key] = existing?.[field.key] ?? common[field.key] ?? null;
      }
      return row;
    }));
  }
}

import { Component, OnInit , signal} from '@angular/core';
import jsPDF from 'jspdf';
import { ApiService } from '../../../shared/services/api/api.service';
import { NotificationService } from '../../../shared/services/notification/notification.service';
import { WMS_API_CONSTANTS as WAC } from '../../constants/wms-api.constants';

interface SplitRoll {
  id: number;
  palletId?: string | null;
  invoiceNo?: string | null;
  supplierName?: string | null;
  ocNo?: string | null;
  poNo?: string | null;
  fabricRef?: string | null;
  styleName?: string | null;
  colorName?: string | null;
  shadeLot?: string | null;
  rollNo?: string | null;
  totalQty?: number | null;
  createdAt?: string | null;
}

interface SplitRollSticker extends SplitRoll {
  qrData: string;
}

@Component({
  selector: 'app-split-roll-list',
  standalone: false,
  templateUrl: './split-roll-list.component.html',
  styleUrl: './split-roll-list.component.css',
})
export class SplitRollListComponent implements OnInit {
  readonly rolls = signal<SplitRoll[]>([])
  selectedRollIds = new Set<number>();
  readonly isLoading = signal(false)
  readonly isDownloading = signal(false)
  rollIdFilter = '';
  fromDate = '';
  toDate = '';

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    const today = this.localDateString(new Date());
    this.fromDate = today;
    this.toDate = today;
    this.loadSplitRolls();
  }

  get filteredRolls(): SplitRoll[] {
    const rollId = this.rollIdFilter.trim().toLowerCase();
    return this.rolls().filter((roll) => {
      const matchesRollId =
        !rollId ||
        [roll.id, roll.shadeLot, roll.rollNo].some((value) =>
          String(value ?? '')
            .toLowerCase()
            .includes(rollId),
        );
      const createdDate = this.createdDate(roll.createdAt);
      const hasDateFilter = Boolean(this.fromDate || this.toDate);
      const matchesFromDate =
        !this.fromDate ||
        (Boolean(createdDate) && createdDate >= this.fromDate);
      const matchesToDate =
        !this.toDate || (Boolean(createdDate) && createdDate <= this.toDate);
      return (
        matchesRollId &&
        matchesFromDate &&
        matchesToDate &&
        (!hasDateFilter || Boolean(createdDate))
      );
    });
  }

  get selectedRolls(): SplitRollSticker[] {
    return this.rolls()
      .filter((roll) => this.selectedRollIds.has(roll.id))
      .map((roll) => ({
        ...roll,
        qrData: [
          roll.shadeLot ?? '',
          roll.ocNo ?? '',
          roll.invoiceNo ?? '',
          roll.supplierName ?? '',
          roll.poNo ?? '',
          roll.fabricRef ?? '',
          roll.styleName ?? '',
          roll.colorName ?? '',
          roll.totalQty ?? '',
        ].join('#$@'),
      }));
  }

  get allRollsSelected(): boolean {
    return (
      this.filteredRolls.length > 0 &&
      this.filteredRolls.every((roll) => this.selectedRollIds.has(roll.id))
    );
  }

  loadSplitRolls(): void {
    this.isLoading.set(true);
    const dateFilters =
      this.fromDate && this.toDate
        ? `&fromDate=${encodeURIComponent(this.fromDate)}&toDate=${encodeURIComponent(this.toDate)}`
        : '';
    this.apiService
      .getDatasByFilter(
        `?isSplitRoll=true&sortBy=createdAt&sortOrder=DESC${dateFilters}`,
        WAC.API_URL + WAC.FabricCollection,
      )
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response?.status !== 200 || !Array.isArray(response?.result)) {
            this.rolls.set([]);
            this.notificationService.error(
              'Unable to load split rolls',
              response?.message ?? 'The split-roll list response was invalid.',
            );
            return;
          }
          this.rolls.set(response.result);
          this.selectedRollIds.clear();
        },
        error: (error) => {
          this.isLoading.set(false);
          this.notificationService.error(
            'Unable to load split rolls',
            error?.error?.message ??
              error?.message ??
              'An error occurred while loading split rolls.',
          );
        },
      });
  }

  toggleRoll(rollId: number, checked: boolean): void {
    if (checked) {
      this.selectedRollIds.add(rollId);
    } else {
      this.selectedRollIds.delete(rollId);
    }
  }

  toggleAllRolls(checked: boolean): void {
    const selected = new Set(this.selectedRollIds);
    this.filteredRolls.forEach((roll) => {
      if (checked) {
        selected.add(roll.id);
      } else {
        selected.delete(roll.id);
      }
    });
    this.selectedRollIds = selected;
  }

  trackByRollId(_index: number, roll: SplitRoll): number {
    return roll.id;
  }

  clearFilters(): void {
    this.rollIdFilter = '';
    this.fromDate = '';
    this.toDate = '';
    this.loadSplitRolls();
  }

  onDateFilterChange(): void {
    this.loadSplitRolls();
  }

  private createdDate(value?: string | null): string {
    if (!value) {
      return '';
    }
    const datePrefix = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    if (datePrefix) {
      return datePrefix;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value.slice(0, 10);
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private localDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  downloadSelectedStickers(): void {
    const selected = this.selectedRolls;
    if (selected.length === 0) {
      this.notificationService.info(
        'Select rolls',
        'Select one or more split rolls before downloading stickers.',
      );
      return;
    }

    const cards = Array.from(
      document.querySelectorAll<HTMLElement>(
        '#selected-split-stickers .sticker-card',
      ),
    );
    const images = cards.map((card) =>
      card.querySelector<HTMLImageElement>('qrcode img'),
    );
    if (
      cards.length !== selected.length ||
      images.some(
        (image) => !image || !image.complete || image.naturalWidth === 0,
      )
    ) {
      this.notificationService.error(
        'Download failed',
        'Selected sticker QR codes are not ready. Please try again.',
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
      selected.forEach((roll, index) => {
        if (index > 0) {
          pdf.addPage([4, 4], 'portrait');
        }
        const image = images[index]!;
        this.drawSticker(pdf, roll, image.src);
      });
      pdf.save('split-roll-stickers-4x4.pdf');
      this.notificationService.success(
        'Downloaded',
        `${selected.length} sticker${selected.length === 1 ? '' : 's'} downloaded.`,
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
    roll: SplitRollSticker,
    qrImage: string,
  ): void {
    pdf.setTextColor(97, 116, 141);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.text('FABRIC ROLL', 0.22, 0.32);
    pdf.setTextColor(45, 99, 159);
    pdf.text(`ROLL ${roll.id}`, 3.78, 0.32, { align: 'right' });
    pdf.setDrawColor(217, 225, 235);
    pdf.line(0.22, 0.46, 3.78, 0.46);

    pdf.setTextColor(29, 53, 87);
    pdf.setFontSize(14);
    pdf.text(roll.shadeLot || '-', 2, 0.78, {
      align: 'center',
      maxWidth: 3.5,
    });
    pdf.addImage(qrImage, 'PNG', 1.25, 0.9, 1.5, 1.5);

    const details: Array<[string, string]> = [
      ['Invoice', roll.invoiceNo ?? '-'],
      ['Supplier', roll.supplierName ?? '-'],
      ['OC / PO', `${roll.ocNo || '-'} / ${roll.poNo || '-'}`],
      ['Reference', roll.fabricRef ?? '-'],
      ['Style / Color', `${roll.styleName || '-'} / ${roll.colorName || '-'}`],
      ['Quantity', String(roll.totalQty ?? '-')],
    ];
    let y = 2.62;
    details.forEach(([label, value]) => {
      pdf.setFontSize(label === 'Quantity' ? 8 : 7);
      pdf.setTextColor(53, 74, 101);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${label}:`, 0.25, y);
      pdf.setTextColor(39, 56, 78);
      pdf.setFont('helvetica', label === 'Quantity' ? 'bold' : 'normal');
      const lines = pdf.splitTextToSize(value, 2.75);
      pdf.text(lines, 1.15, y);
      y += Math.max(0.19, lines.length * 0.12);
    });
  }
}

import { Component , signal} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import jsPDF from 'jspdf';
import { BarcodeFormat } from '@zxing/browser';
import Swal from 'sweetalert2';
import { WMS_API_CONSTANTS as WAC } from '../../constants/wms-api.constants';
import { ApiService } from '../../../shared/services/api/api.service';
import { AuthService } from '../../../auth/services/auth.service';
import { NotificationService } from '../../../shared/services/notification/notification.service';
import { LocalStorageService } from '../../../shared/services/local-storage/local-storage.service';
import { StateManagerService } from '../../services/state-manager/state-manager.service';

interface SplitRollPreview {
  rollIndex: number;
  shadeLot: string;
  totalQty: number | null;
  qrData: string;
}

interface SourceRollDetails {
  shadeLot: string;
  ocNo: string;
  invoiceNo: string;
  supplierName: string;
  poNo: string;
  fabricRef: string;
  styleName: string;
  colorName: string;
  totalQty: number;
}

@Component({
  selector: 'app-split-merge-roll',
  standalone: false,
  templateUrl: './split-merge-roll.component.html',
  styleUrl: './split-merge-roll.component.css',
})
export class SplitMergeRollComponent {
  resetPalletId() {
    if (this.palletEntryTimeout) {
      clearTimeout(this.palletEntryTimeout);
      this.palletEntryTimeout = undefined;
    }
    this.form.patchValue({ palletId: '' });
    this.storage.removeItem('palletId');
    this.palletScanned = false;
    this.fabrics.set([]);
    this.clearSourceRoll();
    this.isScannerActive = false;
    this.focusIn = '';
  }

  onPalletIdChanged(): void {
    this.palletScanned = false;
    this.fabrics.set([]);
    this.clearSourceRoll();
    if (this.palletEntryTimeout) {
      clearTimeout(this.palletEntryTimeout);
      this.palletEntryTimeout = undefined;
    }
    if (!this.autoPalletLookup()) {
      return;
    }
    if (!String(this.form.get('palletId')?.value ?? '').trim()) {
      return;
    }
    this.palletEntryTimeout = setTimeout(() => {
      this.palletEntryTimeout = undefined;
      this.fetchFabricCollections();
    }, 400);
  }

  setPalletEntryMode(autoLookup: boolean): void {
    this.autoPalletLookup.set(autoLookup);
    if (this.palletEntryTimeout) {
      clearTimeout(this.palletEntryTimeout);
      this.palletEntryTimeout = undefined;
    }
    if (autoLookup && this.form.get('palletId')?.value) {
      this.onPalletIdEntered();
    }
  }

  onPalletIdEntered(): void {
    if (this.palletEntryTimeout) {
      clearTimeout(this.palletEntryTimeout);
      this.palletEntryTimeout = undefined;
    }
    if (!String(this.form.get('palletId')?.value ?? '').trim()) {
      return;
    }
    this.fetchFabricCollections();
  }
  formats: BarcodeFormat[] = [BarcodeFormat.QR_CODE];
  isScannerActive: boolean = false;
  scanFor: string = '';
  dataFetched: boolean = false;
  readonly fabrics = signal<any[]>([])
  readonly splitCount = signal(2)
  readonly autoPalletLookup = signal(true)
  splitQuantities: FormArray<FormControl<number | null>>;
  readonly isCreatingBatch = signal(false)
  readonly isProcessingSourceRoll = signal(false)
  readonly sourceRollVerified = signal(false)
  private sourceRollId: number | null = null;
  palletScanned = false;
  private lastPromptedFabricId = '';
  private fabricEntryTimeout?: ReturnType<typeof setTimeout>;
  private palletEntryTimeout?: ReturnType<typeof setTimeout>;

  form: FormGroup; // Reactive form instance
  readonly warehouses = signal<any[]>([])
  focusIn: string = '';
  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private notificationService: NotificationService,
    public authService: AuthService,
    public storage: LocalStorageService,
    private stateManager: StateManagerService,
  ) {
    this.stateManager.getWarehouses$().subscribe((warehouses) => {
      this.warehouses.set(warehouses);
    });
    this.splitQuantities = new FormArray<FormControl<number | null>>([
      this.createSplitQuantityControl(),
      this.createSplitQuantityControl(),
    ]);
    this.form = this.formBuilder.group({
      palletId: [this.storage.getItem('palletId') ?? ''],
      fabricId: ['', Validators.required],
      invoiceNo: ['', Validators.required],
      supplierName: [''],
      ocNo: [''],
      poNo: [''],
      fabricRef: [''],
      styleName: [''],
      colorName: [''],
      shadeLot: ['', Validators.required],
      totalQty: [
        { value: '', disabled: true },
        [Validators.required, Validators.min(0.01)],
      ],
      rollNo: [''],
      wareHouseId: [
        this.storage.getItem('selectedWarehouse') ?? '',
        Validators.required,
      ],
    });
    this.splitQuantities.setValidators(() => {
      const sourceQty = Number(this.form.get('totalQty')?.value);
      if (!Number.isFinite(sourceQty) || sourceQty <= 0) {
        return null;
      }

      return this.splitQuantityTotal === sourceQty
        ? null
        : {
            splitQuantityTotalMismatch: {
              expected: sourceQty,
              actual: this.splitQuantityTotal,
            },
          };
    });
    this.splitQuantities.updateValueAndValidity();
  }

  get splitRollPreviews(): SplitRollPreview[] {
    const values = this.form.getRawValue();
    return this.splitQuantities.controls.map((control, index) => {
      const shadeLot = `${values.shadeLot ?? ''}-R${index + 1}`;
      const totalQty = control.value;
      return {
        rollIndex: index + 1,
        shadeLot,
        totalQty,
        qrData: [
          shadeLot,
          values.ocNo,
          values.invoiceNo,
          values.supplierName,
          values.poNo,
          values.fabricRef,
          values.styleName,
          values.colorName,
          totalQty ?? '',
        ].join('#$@'),
      };
    });
  }

  get hasValidSplitQuantities(): boolean {
    const sourceQty = Number(this.form.get('totalQty')?.value);
    const splitQtys = this.splitQuantities.controls.map((control) =>
      Number(control.value),
    );
    return (
      Number.isFinite(sourceQty) &&
      sourceQty > 0 &&
      Number.isInteger(sourceQty) &&
      splitQtys.length >= 2 &&
      this.splitQuantities.valid &&
      splitQtys.every(
        (qty) => Number.isInteger(qty) && Number.isFinite(qty) && qty > 0,
      ) &&
      splitQtys.reduce((total, qty) => total + qty, 0) === sourceQty
    );
  }

  get splitQuantityTotal(): number {
    return this.splitQuantities.controls.reduce(
      (total, control) => total + (Number(control.value) || 0),
      0,
    );
  }

  get sourceQuantity(): number {
    return Number(this.form.get('totalQty')?.value) || 0;
  }

  trackByRollIndex(_index: number, roll: SplitRollPreview): number {
    return roll.rollIndex;
  }

  private createSplitQuantityControl(): FormControl<number | null> {
    return new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      (control) =>
        control.value == null || Number.isInteger(Number(control.value))
          ? null
          : { wholeNumber: true },
    ]);
  }

  get canCreateBatch(): boolean {
    return (
      this.form.valid &&
      Boolean(this.form.get('shadeLot')?.value?.trim()) &&
      Boolean(this.form.get('invoiceNo')?.value?.trim()) &&
      this.hasValidSplitQuantities &&
      this.sourceRollVerified() &&
      !this.isProcessingSourceRoll() &&
      !this.isCreatingBatch()
    );
  }

  onSplitCountChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const count = Number(input.value);
    if (!Number.isInteger(count) || count < 2) {
      input.value = String(this.splitCount());
      return;
    }

    const currentQuantities = this.splitQuantities.controls.map(
      (control) => control.value,
    );
    this.splitQuantities.clear();
    for (let index = 0; index < count; index += 1) {
      const control = this.createSplitQuantityControl();
      control.setValue(currentQuantities[index] ?? null);
      this.splitQuantities.push(control);
    }
    this.splitCount.set(count);
  }

  downloadStickers(): void {
    if (
      !this.hasValidSplitQuantities ||
      this.splitRollPreviews.some((roll) => !roll.qrData)
    ) {
      this.notificationService.info(
        'Info',
        'Enter a quantity for every roll before printing stickers.',
      );
      return;
    }

    const qrImages = Array.from(
      document.querySelectorAll<HTMLImageElement>(
        '#sticker-print-area .sticker-card qrcode img',
      ),
    );
    if (
      qrImages.length !== this.splitQuantities.length ||
      qrImages.some((image) => !image.complete || image.naturalWidth === 0)
    ) {
      this.notificationService.error(
        'Download failed',
        'The sticker QR codes are not ready. Please try again.',
      );
      return;
    }

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [4, 4],
        compress: true,
      });
      const values = this.form.getRawValue();
      const rolls = this.splitRollPreviews;

      rolls.forEach((roll, index) => {
        if (index > 0) {
          pdf.addPage([4, 4], 'portrait');
        }

        pdf.setTextColor(97, 116, 141);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.text('FABRIC ROLL', 0.22, 0.32);
        pdf.setTextColor(45, 99, 159);
        pdf.text(`ROLL ${roll.rollIndex}`, 3.78, 0.32, { align: 'right' });
        pdf.setDrawColor(217, 225, 235);
        pdf.line(0.22, 0.46, 3.78, 0.46);

        pdf.setTextColor(29, 53, 87);
        pdf.setFontSize(14);
        pdf.text(roll.shadeLot, 2, 0.78, {
          align: 'center',
          maxWidth: 3.5,
        });
        pdf.addImage(qrImages[index].src, 'PNG', 1.25, 0.9, 1.5, 1.5);

        const details: Array<[string, string]> = [
          ['Invoice', values.invoiceNo],
          ['Supplier', values.supplierName],
          ['OC / PO', `${values.ocNo || '-'} / ${values.poNo || '-'}`],
          ['Reference', values.fabricRef],
          [
            'Style / Color',
            `${values.styleName || '-'} / ${values.colorName || '-'}`,
          ],
          ['Quantity', String(roll.totalQty ?? '')],
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
      });

      pdf.save('fabric-roll-stickers-4x4.pdf');
    } catch (error) {
      this.notificationService.error(
        'Download failed',
        error instanceof Error
          ? error.message
          : 'Unable to generate the 4 x 4 inch sticker PDF.',
      );
    }
  }

  fetchFabricCollections(
    currentPalletId?: string,
    showEmptyMessage = true,
  ): void {
    if (this.palletEntryTimeout) {
      clearTimeout(this.palletEntryTimeout);
      this.palletEntryTimeout = undefined;
    }
    const palletId = currentPalletId ?? this.form.get('palletId')?.value;
    const wareHouseId = this.form.get('wareHouseId')?.value;

    if (palletId) {
      this.palletScanned = false;
      this.fabrics.set([]);
      this.dataFetched = false;
      this.storage.setItem('palletId', palletId);
      this.apiService
        .getDatasByFilter(
          '?status=Quarantine&status=pass&status=reject&palletId=' +
            palletId +
            '&wareHouseId=' +
            wareHouseId,
          WAC.API_URL + WAC.FabricCollection,
        )
        .subscribe({
          next: (response) => {
            if (String(this.form.get('palletId')?.value) !== String(palletId)) {
              return;
            }
            if (response?.status == 200 && response?.result?.length > 0) {
              this.fabrics.set(response?.result);
              this.dataFetched = true;
              this.palletScanned = true;
            } else {
              this.fabrics.set([]);
              this.palletScanned = false;
              if (showEmptyMessage) {
                this.notificationService.info('Info', 'Your Pallet Is Empty');
              }
            }
          },
          error: (error) => {
            if (String(this.form.get('palletId')?.value) !== String(palletId)) {
              return;
            }
            this.palletScanned = false;
            this.notificationService.error(
              'Failed',
              error?.error?.message ??
                error?.message ??
                'Unable to load rolls for this pallet.',
            );
          },
        });
    } else {
      this.palletScanned = false;
      if (showEmptyMessage) {
        this.notificationService.info('Info', 'Your Pallet Is Empty');
      }
    }
  }

  toggleScanner(scanFor: string): void {
    this.focusIn = '';
    this.scanFor = scanFor;
    this.isScannerActive = !this.isScannerActive;
    if (!this.isScannerActive) {
      this.scanFor = '';
      this.focusIn = '';
    }
  }
  setFormData(data: any) {
    const segments = data?.split('#$@');
    if (segments && segments.length >= 9) {
      this.form.patchValue({
        shadeLot: segments[0].replace(/#$@/g, '') ?? '',
        ocNo: segments[1].replace(/#$@/g, '') ?? '',
        invoiceNo: segments[2].replace(/#$@/g, '') ?? '',
        supplierName: segments[3].replace(/#$@/g, '') ?? '',
        poNo: segments[4].replace(/#$@/g, '') ?? '',
        fabricRef: segments[5].replace(/#$@/g, '') ?? '',
        styleName: segments[6].replace(/#$@/g, '') ?? '',
        colorName: segments[7].replace(/#$@/g, '') ?? '',
        totalQty: Math.round(parseFloat(segments[8])) || 0,
      });
    }
  }

  onScanSuccess(data: string): void {
    if (data && this.scanFor == 'palletId') {
      this.form.patchValue({ palletId: data });
      this.storage.setItem('palletId', data);
      this.fetchFabricCollections(data);
      this.isScannerActive = !this.isScannerActive;
    } else {
      this.splitQuantities.controls.forEach((control) => control.reset());
      this.form.patchValue({ fabricId: data + '#$@' }, { emitEvent: false });
      this.setFormData(data);
      this.confirmSourceRollSplit(data);
    }
  }

  entryfabDetails(): void {
    const fabricId = String(this.form.get('fabricId')?.value ?? '').trim();
    this.setFormData(fabricId);
    if (fabricId.replace(/(?:#\$@)+$/, '') !== this.lastPromptedFabricId) {
      this.sourceRollVerified.set(false);
      this.sourceRollId = null;
    }
    if (this.fabricEntryTimeout) {
      clearTimeout(this.fabricEntryTimeout);
    }
    this.fabricEntryTimeout = setTimeout(() => {
      this.fabricEntryTimeout = undefined;
      this.onFabricIdEntered();
    }, 200);
  }

  onFabricIdEntered(): void {
    const fabricId = String(this.form.get('fabricId')?.value ?? '')
      .trim()
      .replace(/(?:#\$@)+$/, '');
    if (!fabricId) {
      return;
    }
    this.confirmSourceRollSplit(fabricId);
  }

  private confirmSourceRollSplit(fabricId: string): void {
    const segments = fabricId.split('#$@');
    if (
      segments.length < 9 ||
      !segments[0] ||
      !segments[2] ||
      !Number.isFinite(Number(segments[8])) ||
      Number(segments[8]) <= 0 ||
      this.lastPromptedFabricId === fabricId ||
      this.isProcessingSourceRoll()
    ) {
      return;
    }

    this.lastPromptedFabricId = fabricId;
    this.sourceRollVerified.set(false);
    this.sourceRollId = null;
    this.isProcessingSourceRoll.set(true);
    const sourceCriteria = {
      shadeLot: segments[0],
      ocNo: segments[1],
      invoiceNo: segments[2],
      supplierName: segments[3],
      poNo: segments[4],
      fabricRef: segments[5],
      styleName: segments[6],
      colorName: segments[7],
      totalQty: Math.round(Number(segments[8])) || 0,
    };

    this.apiService
      .dataCustomGet(sourceCriteria, WAC.API_URL + WAC.FabricCollection)
      .subscribe({
        next: (response) => {
          const sourceRoll = response?.result;
          if (response?.status !== 200) {
            this.isProcessingSourceRoll.set(false);
            this.lastPromptedFabricId = '';
            this.notificationService.error(
              'Source roll lookup failed',
              response?.message ?? 'Unable to verify whether the roll is in stock.',
            );
            return;
          }
          if (sourceRoll?.id == null) {
            this.promptToReceiveSourceRoll(sourceCriteria);
            return;
          }
          if (String(sourceRoll.status ?? '').toLowerCase() === 'splited') {
            this.resetForm();
            this.notificationService.info(
              'Roll already split',
              'This roll is already marked as Splited and cannot be split again.',
            );
            return;
          }
          void Swal.fire({
            title: 'Are you sure you want to split this roll?',
            text: `The original roll ${sourceRoll.shadeLot ?? sourceCriteria.shadeLot} will be marked as Splited when you create the split rolls.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, continue',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#b42318',
            reverseButtons: true,
          }).then((result) => {
            if (!result.isConfirmed) {
              this.resetForm();
              return;
            }

            this.isProcessingSourceRoll.set(false);
            this.sourceRollId = Number(sourceRoll.id);
            this.sourceRollVerified.set(true);
            this.notificationService.success(
              'Source roll verified',
              'Enter the split quantities below. The source status will update when the rolls are created.',
            );
          });
        },
        error: (error) => {
          this.isProcessingSourceRoll.set(false);
          this.lastPromptedFabricId = '';
          this.notificationService.error(
            'Source roll lookup failed',
            error?.error?.message ??
              error?.message ??
              'Unable to verify the source roll. Its status was not changed.',
          );
        },
      });
  }

  private promptToReceiveSourceRoll(sourceCriteria: SourceRollDetails): void {
    void Swal.fire({
      title: 'Roll not in stock',
      text: `Receive ${sourceCriteria.shadeLot} into stock before splitting it?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, receive roll',
      cancelButtonText: 'No, cancel',
      reverseButtons: true,
    }).then((result) => {
      if (!result.isConfirmed) {
        this.isProcessingSourceRoll.set(false);
        this.lastPromptedFabricId = '';
        return;
      }

      this.receiveSourceRollIntoStock(sourceCriteria);
    });
  }

  private receiveSourceRollIntoStock(sourceCriteria: SourceRollDetails): void {
    this.apiService
      .dataCustomGet(
        {
          InvoiceNo: sourceCriteria.invoiceNo,
          OrderNo: sourceCriteria.poNo,
          OCNo: sourceCriteria.ocNo,
          ShadeLot: sourceCriteria.shadeLot,
        },
        WAC.API_URL + WAC.sourcingAsnDetail,
      )
      .subscribe({
        next: (asnResponse) => {
          if (asnResponse?.status !== 200 || !asnResponse?.result) {
            this.isProcessingSourceRoll.set(false);
            this.lastPromptedFabricId = '';
            this.notificationService.error(
              'Verification Failed',
              'Fabric could not be verified against the ASN. The roll was not received.',
            );
            return;
          }

          const receiveData = {
            ...this.form.getRawValue(),
            ...sourceCriteria,
            balanceQty: sourceCriteria.totalQty,
            createdBy: this.storage.getItem('userId'),
          };

          this.apiService
            .addData(receiveData, WAC.API_URL + WAC.FabricCollection)
            .subscribe({
              next: (receiveResponse) => {
                const receivedRoll = receiveResponse?.result;
                this.isProcessingSourceRoll.set(false);
                if (
                  receiveResponse?.status !== 200 ||
                  receivedRoll?.id == null
                ) {
                  this.lastPromptedFabricId = '';
                  this.notificationService.error(
                    'Receive failed',
                    receiveResponse?.message ??
                      'The roll could not be received into stock.',
                  );
                  return;
                }

                this.sourceRollId = Number(receivedRoll.id);
                this.sourceRollVerified.set(true);
                this.notificationService.success(
                  'Roll received',
                  'The roll was received into stock. Enter split quantities to continue.',
                );
              },
              error: (error) => {
                this.isProcessingSourceRoll.set(false);
                this.lastPromptedFabricId = '';
                this.notificationService.error(
                  'Receive failed',
                  error?.error?.message ??
                    error?.message ??
                    'The roll could not be received into stock.',
                );
              },
            });
        },
        error: (error) => {
          this.isProcessingSourceRoll.set(false);
          this.lastPromptedFabricId = '';
          this.notificationService.error(
            'Verification Failed',
            error?.error?.message ??
              error?.message ??
              'Fabric could not be verified against the ASN. The roll was not received.',
          );
        },
      });
  }

  onSubmit(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.notificationService.info('Info', 'Enter the required roll details.');
      return;
    }

    if (!this.sourceRollVerified() || this.sourceRollId == null) {
      this.notificationService.info(
        'Info',
        'Verify the source roll before creating the split rolls.',
      );
      return;
    }

    if (!this.hasValidSplitQuantities) {
      this.notificationService.info(
        'Split quantities do not match',
        `Enter a positive whole-number quantity for every roll. The split total is ${this.splitQuantityTotal}; it must exactly match the source quantity of ${this.sourceQuantity}.`,
      );
      return;
    }

    const formData = this.form.getRawValue();
    const palletId = String(formData.palletId ?? '').trim();
    const records = this.splitRollPreviews.map((roll) => ({
      ...formData,
      palletId: palletId || undefined,
      fabricId: `${roll.qrData}#$@`,
      shadeLot: roll.shadeLot,
      totalQty: roll.totalQty,
      balanceQty: roll.totalQty,
      isSplitRoll: true,
      createdBy: this.storage.getItem('userId'),
    }));

    this.isCreatingBatch.set(true);
    this.apiService
      .createBatch(
        { records, sourceRollId: this.sourceRollId },
        WAC.API_URL + WAC.FabricCollection,
      )
      .subscribe({
        next: (response) => {
          this.isCreatingBatch.set(false);
          if (response?.status === 200) {
            this.sourceRollVerified.set(false);
            this.notificationService.success(
              'Success',
              `${records.length} split rolls created successfully and the source roll was marked as Splited.`,
              5000,
            );
            this.fabrics.set(this.fabrics().filter(
              (fabric) => String(fabric?.id) !== String(this.sourceRollId),
            ));
            const palletId = this.form.get('palletId')?.value;
            this.resetForm();
            if (palletId) {
              this.fetchFabricCollections(palletId, false);
            }
          } else {
            this.notificationService.error(
              'Failed',
              response?.message ?? 'The split-roll batch could not be created.',
            );
          }
        },
        error: (error) => {
          this.isCreatingBatch.set(false);
          this.notificationService.error(
            'Failed',
            error?.error?.message ??
              error?.message ??
              'The split-roll batch could not be created.',
          );
        },
      });
  }

  resetForm(): void {
    if (this.fabricEntryTimeout) {
      clearTimeout(this.fabricEntryTimeout);
      this.fabricEntryTimeout = undefined;
    }
    const currentPalletId = this.form.get('palletId')?.value;
    const currentWarehouseId = this.form.get('wareHouseId')?.value;

    this.form.reset();
    this.form.patchValue({
      palletId: currentPalletId,
      wareHouseId: currentWarehouseId,
    });
    this.splitCount.set(2);
    this.splitQuantities.clear();
    this.splitQuantities.push(this.createSplitQuantityControl());
    this.splitQuantities.push(this.createSplitQuantityControl());
    this.sourceRollVerified.set(false);
    this.sourceRollId = null;
    this.isProcessingSourceRoll.set(false);
    this.palletScanned = false;
    this.fabrics.set([]);
    this.lastPromptedFabricId = '';
    this.focusIn = '';
    this.isScannerActive = false;
  }

  private clearSourceRoll(): void {
    if (this.fabricEntryTimeout) {
      clearTimeout(this.fabricEntryTimeout);
      this.fabricEntryTimeout = undefined;
    }
    this.form.patchValue({
      fabricId: '',
      invoiceNo: '',
      supplierName: '',
      ocNo: '',
      poNo: '',
      fabricRef: '',
      styleName: '',
      colorName: '',
      shadeLot: '',
      totalQty: '',
      rollNo: '',
    });
    this.splitQuantities.controls.forEach((control) => control.reset());
    this.sourceRollVerified.set(false);
    this.sourceRollId = null;
    this.lastPromptedFabricId = '';
  }
}

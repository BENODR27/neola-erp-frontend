import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { finalize } from 'rxjs';
import { MmmsStoredFile } from '../../models/mmms-file.models';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
@Component({
  selector: 'app-mmms-attachments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <section aria-label="Attachments">
    <h3>Attachments</h3>
    <label *ngIf="!readonly"
      >Document category<select [(ngModel)]="category" [ngModelOptions]="{ standalone: true }">
        <option *ngFor="let item of categories()" [value]="item">{{ item }}</option>
      </select></label
    ><input
      *ngIf="!readonly"
      type="file"
      multiple
      (change)="upload($event)"
      [disabled]="busy()"
      aria-label="Upload attachments"
    />
    <p *ngIf="busy()" role="status">Uploading…</p>
    <p *ngIf="error()" role="alert">{{ error() }}</p>
    <ul>
      <li *ngFor="let file of files">
        <button type="button" (click)="download(file)">
          {{ file.category || 'Other' }} · {{ file.name }} ({{ file.size | number }} bytes)</button
        ><button *ngIf="!readonly" type="button" (click)="remove(file)">Remove reference</button>
      </li>
    </ul>
  </section>`,
})
export class MmmsAttachmentsComponent implements OnInit {
  @Input() files: MmmsStoredFile[] = [];
  @Input() readonly = false;
  @Output() filesChange = new EventEmitter<MmmsStoredFile[]>();
  readonly busy = signal(false);
  readonly error = signal('');
  categories = signal<string[]>([]);
  category = 'Other';
  ngOnInit(): void {
    this.facade
      .getSettings()
      .subscribe({ next: (settings) => this.categories.set(settings.documentCategories) });
  }
  private readonly facade = inject(MmmsFacadeService);
  upload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.busy.set(true);
    this.error.set('');
    this.facade
      .uploadAttachments(input.files)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (files) => {
          this.filesChange.emit([
            ...this.files,
            ...files.map((file) => ({ ...file, category: this.category })),
          ]);
          input.value = '';
        },
        error: () =>
          this.error.set('Upload failed. Check file permissions, size and the storage connection.'),
      });
  }
  download(file: MmmsStoredFile): void {
    this.facade.downloadAttachment(file).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: () => this.error.set('Attachment is unavailable or outside your access scope.'),
    });
  }
  remove(file: MmmsStoredFile): void {
    this.filesChange.emit(this.files.filter((item) => item.id !== file.id));
  }
}

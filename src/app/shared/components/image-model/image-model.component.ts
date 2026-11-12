import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-image-modal',
  template: `
    <div class="image-modal">
      <img [src]="data.imageUrl" alt="Full Image" />
    </div>
  `,
  styles: [
    `
      .image-modal img {
        width: 100%;
        height: auto;
      }
    `,
  ],
})
export class ImageModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { imageUrl: string }) {}
}

// Backwards-compatible export for existing consumers and tests.
export { ImageModalComponent as ImageModelComponent };

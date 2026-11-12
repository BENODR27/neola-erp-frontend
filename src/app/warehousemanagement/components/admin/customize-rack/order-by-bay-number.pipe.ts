import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderByBayNumber',
  standalone: true,
})
export class OrderByBayNumberPipe implements PipeTransform {
  transform(bays: any[]): any[] {
    if (!Array.isArray(bays)) return bays;
    return [...bays].sort((a, b) => {
      const aNum = parseFloat(a.bayNumber);
      const bNum = parseFloat(b.bayNumber);
      const aIsNum = !isNaN(aNum) && isFinite(aNum);
      const bIsNum = !isNaN(bNum) && isFinite(bNum);

      if (aIsNum && bIsNum) {
        return aNum - bNum;
      } else if (aIsNum) {
        return -1;
      } else if (bIsNum) {
        return 1;
      }
      return (a.bayNumber || '').localeCompare(b.bayNumber || '', undefined, { numeric: true, sensitivity: 'base' });
    });
  }
}

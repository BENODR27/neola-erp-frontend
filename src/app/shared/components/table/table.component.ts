import { Component, Input, OnInit , signal} from '@angular/core';

@Component({
  selector: 'app-table',
  standalone: false,
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
})
export class TableComponent implements OnInit {
  @Input() headers: string[] = [];
  @Input() fields: string[] = [];
  @Input() rows: any[] = [];
  @Input() customId: any = null;

  readonly filteredRows = signal<any[]>([])
  activeFilter: string | null = null;

  columnValues: { [key: string]: any[] } = {};

  ngOnInit() {
    this.filteredRows.set([...this.rows]);
    this.generateColumnValues();
  }

  ngOnChanges() {
    this.filteredRows.set([...this.rows]);
    this.generateColumnValues();
  }

  generateColumnValues() {
    this.columnValues = {};

    this.fields.forEach((field, index) => {
      const uniqueValues = Array.from(
        new Set(this.rows.map((row) => row[field]).filter((v) => v != null))
      );

      this.columnValues[field] = uniqueValues;
    });
  }

  toggleFilter(field: string) {
    this.activeFilter = this.activeFilter === field ? null : field;
  }

  applyFilter(field: string, value: any) {
    this.filteredRows.set(this.rows.filter((row) => row[field] === value));
    this.activeFilter = null;
  }

  clearFilter() {
    this.filteredRows.set([...this.rows]);
    this.activeFilter = null;
  }
}

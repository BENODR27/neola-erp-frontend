import { Component , signal} from '@angular/core';
import { ApiService } from '../../../shared/services/api/api.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ADMIN_API_CONSTANTS as AAC } from '../../constants/admin-api.constants';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-error-logs',
  imports: [ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './error-logs.component.html',
  styleUrl: './error-logs.component.css',
})
export class ErrorLogsComponent {
  readonly datas = signal<any[]>([])
  form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService
  ) {
    this.form = this.formBuilder.group({
      name: ['', Validators.required],
    });
  }
  ngOnInit(): void {
    this.fetchAllErrorLogs();
  }
  fetchAllErrorLogs() {
    this.apiService.getDatas(AAC.WU_API_URL + AAC.ERROR_LOG).subscribe({
      next: (response) => {
        this.datas.set(response.result);
        console.log('Filtered Data:', response.result);
      },
      error: (error) => {
        console.error('Error:', error);
      },
    });
  }
}

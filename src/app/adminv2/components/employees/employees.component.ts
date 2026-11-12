import { Component , signal} from '@angular/core';
import { ApiService } from '../../../shared/services/api/api.service';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ADMIN_API_CONSTANTS as AAC } from '../../constants/admin-api.constants';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../shared/services/notification/notification.service'; // Add NotificationService import

@Component({
  selector: 'app-employees',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.css',
})
export class EmployeesComponent {
  readonly datas = signal<any[]>([])
  form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private notificationService: NotificationService // Add NotificationService
  ) {
    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      employeeCode: ['', Validators.required],
      employeeName: ['', Validators.required],
      department: ['', Validators.required],
      designation: ['', Validators.required],
      gender: ['', Validators.required],
      isAuthOn: [false, Validators.required],
      authCode: ['', Validators.required],
    });
  }
  ngOnInit(): void {
    this.fetchAllErrorLogs();
  }
  fetchAllErrorLogs() {
    this.apiService.getDatas(AAC.WU_API_URL + AAC.EMPLOYEES).subscribe({
      next: (response) => {
        this.datas.set(response.result.map((data: any) => ({
          id: data.id,
          employeeCode: data.employeeCode,
          employeeName: data.employeeName,
          department: data.department,
          designation: data.designation,
          gender: data.gender,
          isAuthOn: data.isAuthOn,
          authCode: data.authCode,
          createdAt: data.createdAt,
        })));
        console.log('Filtered Data:', this.datas());
      },
      error: (error) => {
        console.error('Error:', error);
      },
    });
  }
  onSubmit(): void {
    console.log('Form submitted:', this.form.value);
    const formData: any = this.form.value;
    this.apiService
      .addData(formData, AAC.WU_API_URL + AAC.EMPLOYEES)
      .subscribe({
        next: (response) => {
          if (response?.status === 200 && response?.result) {
            this.fetchAllErrorLogs();
            this.notificationService.info(
              'Success',
              'Employee Added Successfully'
            );
            this.form.reset();
          }
        },
        error: (error) => {
          this.notificationService.error('Error', error, 3000);
        },
      });
  }
}

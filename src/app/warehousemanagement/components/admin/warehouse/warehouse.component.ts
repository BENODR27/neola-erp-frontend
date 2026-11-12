import { Component , signal} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../../shared/services/api/api.service';
import { WMS_API_CONSTANTS as WAC } from '../../../constants/wms-api.constants';

@Component({
  selector: 'app-warehouse',
  standalone: false,
  templateUrl: './warehouse.component.html',
  styleUrl: './warehouse.component.css',
})
export class WarehouseComponent {
  readonly datas = signal<any[]>([])
  form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService
  ) {
    this.form = this.formBuilder.group({
      wareHouseName: ['', Validators.required],
    });
  }
  ngOnInit(): void {
    this.fetchAll();
  }
  fetchAll() {
    this.apiService.getDatas(WAC.API_URL + WAC.WareHouse).subscribe({
      next: (response) => {
        this.datas.set(response.result);

        console.log('Filtered Data:', response.result);
      },
      error: (error) => {
        console.error('Error:', error);
      },
    });
  }
  create() {
    const formData: any = this.form.value;
    this.apiService.addData(formData, WAC.API_URL + WAC.WareHouse).subscribe({
      next: (response) => {
        // if(response.status==200){
        //   Swal.fire({
        //     title: 'Good job!',
        //     timer: 1000,
        //     text: 'Datas fetched Successfully!',
        //     icon: 'success',
        //   });
        // }else{
        //   Swal.fire({
        //     title: 'Failure!',
        //     timer: 1000,
        //     text: 'Something went wrong!',
        //     icon: 'error',
        //   });
        // }
        console.log('Filtered Data:', response);
        this.fetchAll();
      },
      error: (error) => {
        console.error('Error:', error);
      },
    });
  }
}

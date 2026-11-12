import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ApiService } from '../../../../shared/services/api/api.service';
import { WMS_API_CONSTANTS as WAC } from '../../../constants/wms-api.constants';
import { OrderByBayNumberPipe } from './order-by-bay-number.pipe';

@Component({
  selector: 'app-customize-rack',
  standalone: false,
  templateUrl: './customize-rack.component.html',
  styleUrl: './customize-rack.component.css',
})
export class CustomizeRackComponent {
  dataFetched: boolean = false;
  fabrics: any[] = [];
  racks: any = [];
  rackForm: FormGroup; // Reactive rackForm instance
  bayForm: FormGroup;
  levelForm: FormGroup;
  binForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService
  ) {
    this.rackForm = this.formBuilder.group({
      palletId: [''],
      wareHouseId: ['1'],
      rackNumber: [''],
    });
    this.bayForm = this.formBuilder.group({
      bayNumber: [''],
      rackId: [],
    });
    this.levelForm = this.formBuilder.group({
      bayId: [''],
      levelNumber: [],
    });
    this.binForm = this.formBuilder.group({
      BinNo: [''],
      bayLevelId: [],
    });
  }
  ngOnInit(): void {}
  fetchWarehouseDatas(): void {
    const wareHouseId = this.rackForm.get('wareHouseId')?.value;
    this.apiService
      .getDataById(wareHouseId, WAC.API_URL + WAC.WareHouse)
      .subscribe((response) => {
        console.log(response);
        if (response != null) {
          this.racks = response?.result.racks;
        } else {
          this.racks = [];
        }
      });
  }
  createRack() {
    const formData: any = this.rackForm.value;
    this.apiService
      .addData(
        {
          wareHouseId: formData.wareHouseId,
          rackNumber: formData.rackNumber,
        },
        WAC.API_URL + WAC.Rack
      )
      .subscribe({
        next: (response) => {
          if (response?.result) {
            // Add new rack directly to racks array
            response.result.bays = []; // Initialize bays array
            this.racks.push(response.result);
          }
          this.rackForm.reset({ wareHouseId: formData.wareHouseId }); // reset form
        },
        error: (error) => console.error('Error:', error),
      });
  }

  setClickedRack(rackId: number) {
    this.bayForm.patchValue({ rackId: rackId });
  }
  createBay() {
    const { bayNumber, rackId } = this.bayForm.value;
    const parsedRackId = Number(rackId);

    // find parent rack
    const rack = this.racks.find((r: any) => Number(r.id) === parsedRackId);
    if (!rack) {
      console.warn('Rack not found for id:', parsedRackId);
      return;
    }
    if (!Array.isArray(rack.bays)) rack.bays = [];

    this.apiService
      .addData({ bayNumber, rackId: parsedRackId }, WAC.API_URL + WAC.Bay)
      .subscribe({
        next: (response) => {
          // some APIs return the created entity in result, some directly
          const created = (response?.result ?? response) as any;
          if (!created) return;

          // ensure shape and trigger change detection + pure pipes
          const newBay = {
            ...created,
            rackId: parsedRackId,
            levels: Array.isArray(created.levels) ? created.levels : [],
          };
          rack.bays = [...rack.bays, newBay]; // <-- new array reference
          this.bayForm.reset();
        },
        error: (error) => console.error('Error:', error),
      });
  }

  setClickedBay(bayId: number) {
    this.levelForm.patchValue({ bayId: bayId });
  }
  createLevel() {
    const formData: any = this.levelForm.value;
    this.apiService
      .addData(
        {
          bayId: formData.bayId,
          levelNumber: formData.levelNumber,
        },
        WAC.API_URL + WAC.BayLevel
      )
      .subscribe({
        next: (response) => {
          if (response?.result) {
            // Find the correct bay and push the new level
            this.racks.forEach((rack: any) => {
              const bay = rack.bays.find((b: any) => b.id === formData.bayId);
              if (bay) {
                response.result.bins = response.result.bins || [];
                bay.levels.push(response.result);
              }
            });
          }
          this.levelForm.reset();
        },
        error: (error) => console.error('Error:', error),
      });
  }

  setClickedLevel(bayLevelId: number) {
    this.binForm.patchValue({ bayLevelId: bayLevelId });
  }
  createBin() {
    const formData: any = this.binForm.value;
    this.apiService
      .addData(
        {
          BinNo: formData.BinNo,
          bayLevelId: formData.bayLevelId,
        },
        WAC.API_URL + WAC.BayLevelBin
      )
      .subscribe({
        next: (response) => {
          if (response?.result) {
            // Find the correct level inside racks
            this.racks.forEach((rack: any) => {
              rack.bays.forEach((bay: any) => {
                const level = bay.levels.find(
                  (l: any) => l.id === formData.bayLevelId
                );
                if (level) {
                  level.bins.push(response.result);
                }
              });
            });
          }
          this.binForm.reset();
        },
        error: (error) => console.error('Error:', error),
      });
  }

  deleteBin(binId: number) {
    this.apiService.deleteData(binId, WAC.API_URL + WAC.BayLevelBin).subscribe({
      next: () => {
        // Remove bin locally without refreshing
        this.racks.forEach((rack: any) => {
          rack.bays.forEach((bay: any) => {
            bay.levels.forEach((level: any) => {
              level.bins = level.bins.filter((bin: any) => bin.id !== binId);
            });
          });
        });
      },
      error: (error) => console.error('Error:', error),
    });
  }

  deleteLevel(bayLevelId: number) {
    this.apiService
      .deleteData(bayLevelId, WAC.API_URL + WAC.BayLevel)
      .subscribe({
        next: () => {
          // Remove the level locally without refetching
          this.racks.forEach((rack: any) => {
            rack.bays.forEach((bay: any) => {
              bay.levels = bay.levels.filter(
                (level: any) => level.id !== bayLevelId
              );
            });
          });
        },
        error: (error) => console.error('Error:', error),
      });
  }

  deleteBay(bayId: number) {
    this.apiService.deleteData(bayId, WAC.API_URL + WAC.Bay).subscribe({
      next: () => {
        this.racks.forEach((r: any) => {
          r.bays = r.bays.filter((b: any) => b.id !== bayId);
        });
      },
      error: (error) => console.error('Error:', error),
    });
  }

  deleteRack(rackId: number) {
    this.apiService.deleteData(rackId, WAC.API_URL + WAC.Rack).subscribe({
      next: () => {
        this.racks = this.racks.filter((r: any) => r.id !== rackId);
      },
      error: (error) => console.error('Error:', error),
    });
  }
}

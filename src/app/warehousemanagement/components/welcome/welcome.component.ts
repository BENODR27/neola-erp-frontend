import { Component, OnInit , signal} from '@angular/core';
import { LocalStorageService } from '../../../shared/services/local-storage/local-storage.service';
import { ApiService } from '../../../shared/services/api/api.service';
import Swal from 'sweetalert2';
import { CustomApiService } from '../../services/custom-api.service';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { Store } from '@ngrx/store';
import { selectWarehouses } from '../../store/warehouse/warehouse.selectors';
import { loadWarehouses } from '../../store/warehouse/warehouse.actions';
import { StateManagerService } from '../../services/state-manager/state-manager.service';

@Component({
  selector: 'app-welcome',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
})
export class WelcomeComponent implements OnInit {
  teams: any; // Array to hold team data
  readonly isModalVisible = signal(false)
  readonly warehouses = signal<any[]>([])
  facilities: any[] = [];
  readonly selectedWarehouse = signal<string | null>(null)
  selectedFacility: string | null = null;

  constructor(
    public authService: AuthService,
    private localStorage: LocalStorageService,
    private stateManager: StateManagerService,
  ) {
    this.selectedWarehouse.set(this.localStorage.getItem<string>('selectedWarehouse'));
    this.selectedFacility =
      this.localStorage.getItem<string>('selectedFacility');
    this.stateManager.getWarehouses$().subscribe((warehouses) => {
      this.warehouses.set(warehouses);
      this.setDefaultWarehouse();
    });
  }

  ngOnInit() {
    // Mock facilities, replace with API/store if needed
    this.facilities = [
      { id: '1', name: 'CF1' },
      { id: '2', name: 'CF2' },
    ];
  }

  get selectedWarehouseName(): string {
    return (
      this.warehouses().find(
        (warehouse) => String(warehouse.id) === this.selectedWarehouse(),
      )?.wareHouseName ?? 'Select a warehouse'
    );
  }

  private setDefaultWarehouse(): void {
    if (this.selectedWarehouse()) {
      return;
    }

    const defaultWarehouse = this.warehouses().find(
      (warehouse) =>
        String(warehouse.wareHouseName ?? '')
          .trim()
          .toLowerCase() === 'cw3',
    );
    if (defaultWarehouse) {
      this.selectedWarehouse.set(String(defaultWarehouse.id));
      this.localStorage.setItem('selectedWarehouse', this.selectedWarehouse());
    }
  }

  showReleaseNotes() {
    this.isModalVisible.set(true);
  }

  closeModal() {
    this.isModalVisible.set(false);
  }

  onWarehouseChange(event: any) {
    this.selectedWarehouse.set(event.target.value);
    this.localStorage.setItem('selectedWarehouse', this.selectedWarehouse());
  }

  onFacilityChange(event: any) {
    this.selectedFacility = event.target.value;
    this.localStorage.setItem('selectedFacility', this.selectedFacility);
  }
}

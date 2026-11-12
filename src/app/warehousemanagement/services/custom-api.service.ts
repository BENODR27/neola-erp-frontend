import { Injectable } from '@angular/core';
import { ApiService } from '../../shared/services/api/api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CustomApiService extends ApiService {
  BatchAllocateToInspection(reqParams: any, apiUrl: string): Observable<any> {
    return this.httpService.post<any>(
      `${apiUrl}/batchAllocateToInspection`,
      reqParams
    );
  }
  inspectionUpdateWMS(reqParams: any, apiUrl: string): Observable<any> {
    return this.httpService.post<any>(
      `${apiUrl}/allocate/inspection/update/wms`,
      reqParams
    );
  }
}

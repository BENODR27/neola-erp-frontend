import { Injectable } from '@angular/core';
import { HttpService } from '../../../shared/services/http/http.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  create(bookingData: { bookingNo: any; bookingStatus: string; entityId: any; departmentId: any; purpose: any; priority: any; requestedShipDate: Date; requiredDeliveryDate: null; poNumber: null; style: null; description: any; content: string; courierId: any; fuelPercentage: null; accountNumber: any; currency: any; expectedCharge: null; billedCharge: null; variance: null; trackingNo: null; awbGeneratedAt: null; deliveredAt: null; createdAt: Date; updatedAt: Date; shipmentMode: any; pickupPlace: any; senderName: any; senderCompany: any; senderPhone: any; senderEmail: any; consigneeName: any; consigneeCompany: any; consigneePhone: any; consigneeEmail: any; packageType: any; declaredValue: any; serviceType: any; dutiesPayer: any; billingParty: any; }, arg1: string) {
    throw new Error('Method not implemented.');
  }
  constructor(public httpService: HttpService) {}

  getDatasByFilter(query: string, apiUrl: string): Observable<any> {
    return this.httpService.get<any>(apiUrl + (query ? query : ''));
  }
  dataCustomGet(data: any, apiUrl: string): Observable<any> {
    return this.httpService.post<any>(apiUrl + '/customGet', data);
  }
  datasCustomGet(data: any, apiUrl: string): Observable<any> {
    return this.httpService.post<any>(apiUrl + '/customGetAll', data);
  }
  getDatas(apiUrl: string): Observable<any> {
    return this.httpService.get<any>(apiUrl);
  }

  getDataById(id: number, apiUrl: string): Observable<any> {
    return this.httpService.get<any>(`${apiUrl}/${id}`);
  }

  addData(data: any, apiUrl: string): Observable<any> {
    return this.httpService.post<any>(apiUrl, data);
  }
  postApi(data: any, apiUrl: string): Observable<any> {
    return this.httpService.post<any>(apiUrl, data);
  }
  createBatch(datas: any, apiUrl: string): Observable<any> {
    return this.httpService.post<any>(`${apiUrl}/createBatch`, datas);
  }
  updateData(id: number, data: any, apiUrl: string): Observable<any> {
    return this.httpService.put<any>(`${apiUrl}/${id}`, data);
  }
  putAtUrl(apiUrl: string, data: any): Observable<any> {
    return this.httpService.put<any>(apiUrl, data);
  }
  deleteAtUrl(apiUrl: string): Observable<any> {
    return this.httpService.delete<any>(apiUrl);
  }
  updateBatch(datas: any, apiUrl: string): Observable<any> {
    return this.httpService.post<any>(`${apiUrl}/updateBatch`, datas);
  }
  customUpdateAll(datas: any, apiUrl: string): Observable<any> {
    return this.httpService.post<any>(`${apiUrl}/customUpdateAll`, datas);
  }
  deleteData(id: number, apiUrl: string): Observable<void> {
    return this.httpService.delete<void>(`${apiUrl}/${id}`);
  }
  deleteWithFilter(data: any, apiUrl: string): Observable<any> {
    return this.httpService.post<any>(apiUrl + '/deleteWithFilter', data);
  }
  patchData(id: number, data: Partial<any>, apiUrl: string): Observable<any> {
    return this.httpService.patch<any>(`${apiUrl}/${id}`, data);
  }

  patchDataAtUrl(apiUrl: string, data: any): Observable<any> {
    return this.httpService.patch<any>(apiUrl, data);
  }

  patchDataByFilter(query: string, data: any, apiUrl: string): Observable<any> {
    return this.httpService.patch<any>(
      apiUrl + '/updateWithFilter' + (query ? query : ''),
      data,
    );
  }
  updateBulkDataEach(data: any, apiUrl: string): Observable<any> {
    return this.httpService.patch<any>(apiUrl + '/updateBulkDataEach', data);
  }
}

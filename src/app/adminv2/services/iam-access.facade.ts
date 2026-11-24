import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ADMIN_API_CONSTANTS } from '../constants/admin-api.constants';
export interface IamScopeOptions {
  applications: string[];
  organizations: Array<{ id: string; name: string }>;
  factories: Array<{ id: string; name: string; organization_id: string }>;
}
@Injectable({ providedIn: 'root' })
export class IamAccessFacade {
  private readonly http = inject(HttpClient);
  private readonly url = ADMIN_API_CONSTANTS.API_URL;
  settings(): Observable<{ managed: boolean }> {
    return this.http.get<{ managed: boolean }>(this.url + '/control-settings');
  }
  scopeOptions(): Observable<{ result: IamScopeOptions }> {
    return this.http.get<{ result: IamScopeOptions }>(this.url + '/users/access-options');
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE, CountryOption, Vehicle, VehicleInput, VehicleList, VehicleOptions } from './models';

@Injectable({ providedIn: 'root' })
export class FleetService {
  private readonly http = inject(HttpClient);

  countries(): Observable<CountryOption[]> {
    return this.http.get<CountryOption[]>(`${API_BASE}/reference/countries`);
  }

  vehicleOptions(): Observable<VehicleOptions> {
    return this.http.get<VehicleOptions>(`${API_BASE}/reference/vehicle-options`);
  }

  list(): Observable<VehicleList> {
    return this.http.get<VehicleList>(`${API_BASE}/vehicles`);
  }

  create(payload: VehicleInput): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${API_BASE}/vehicles`, payload);
  }

  update(id: number, payload: Partial<VehicleInput>): Observable<Vehicle> {
    return this.http.patch<Vehicle>(`${API_BASE}/vehicles/${id}`, payload);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/vehicles/${id}`);
  }
}

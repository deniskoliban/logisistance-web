import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

import {
  API_BASE,
  CountryOption,
  Vehicle,
  VehicleCatalog,
  VehicleInput,
  VehicleList,
  VehicleOptions,
} from '../models';

@Injectable({ providedIn: 'root' })
export class FleetService {
  private readonly http = inject(HttpClient);
  private countries$?: Observable<CountryOption[]>;
  private vehicleOptions$?: Observable<VehicleOptions>;
  private vehicleCatalog$?: Observable<VehicleCatalog>;

  /** Cached: several country fields on one screen must not trigger several requests. */
  countries(): Observable<CountryOption[]> {
    this.countries$ ??= this.http
      .get<CountryOption[]>(`${API_BASE}/reference/countries`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.countries$;
  }

  vehicleOptions(): Observable<VehicleOptions> {
    this.vehicleOptions$ ??= this.http
      .get<VehicleOptions>(`${API_BASE}/reference/vehicle-options`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.vehicleOptions$;
  }

  /**
   * Every make and model the pickers offer (~200 makes).
   *
   * Fetched once and shared: the payload is a few dozen kilobytes gzipped, and keeping it in
   * memory means a driver who opens the form again in a truck with no signal still sees the lists.
   */
  vehicleCatalog(): Observable<VehicleCatalog> {
    this.vehicleCatalog$ ??= this.http
      .get<VehicleCatalog>(`${API_BASE}/reference/vehicle-catalog`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.vehicleCatalog$;
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

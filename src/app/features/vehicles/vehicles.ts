import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { apiErrorMessage } from '../../core/api-error';
import { FleetService } from '../../core/fleet.service';
import { BodyType, OptionItem, Vehicle, VehicleInput, VehicleOptions, VehicleType } from '../../core/models';

@Component({
  selector: 'app-vehicles',
  imports: [ReactiveFormsModule],
  templateUrl: './vehicles.html',
})
export class Vehicles implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly fleet = inject(FleetService);

  protected readonly vehicles = signal<Vehicle[]>([]);
  protected readonly vehicleTypes = signal<OptionItem[]>([]);
  protected readonly bodyTypes = signal<OptionItem[]>([]);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly editingId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    label: ['', [Validators.required, Validators.maxLength(80)]],
    plate: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    vehicle_type: ['articulated_truck' as VehicleType, [Validators.required]],
    body_type: ['curtain_side' as BodyType, [Validators.required]],
    payload_kg: [null as number | null, [Validators.required, Validators.min(1), Validators.max(60000)]],
    volume_m3: [null as number | null, [Validators.min(0)]],
    max_range_km: [null as number | null, [Validators.min(0)]],
    length_m: [null as number | null, [Validators.min(0)]],
    width_m: [null as number | null, [Validators.min(0)]],
    height_m: [null as number | null, [Validators.min(0)]],
    cargo_length_m: [null as number | null, [Validators.min(0)]],
    cargo_width_m: [null as number | null, [Validators.min(0)]],
    cargo_height_m: [null as number | null, [Validators.min(0)]],
  });

  ngOnInit(): void {
    this.reload();
  }

  protected optionLabel(options: OptionItem[], value: string | undefined): string {
    if (!value) {
      return '—';
    }
    return options.find((option) => option.value === value)?.label ?? value.replace(/_/g, ' ');
  }

  protected vehicleTypeLabel(value: string): string {
    return this.optionLabel(this.vehicleTypes(), value);
  }

  protected bodyTypeLabel(value: string): string {
    return this.optionLabel(this.bodyTypes(), value);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    this.saving.set(true);
    this.error.set(null);
    this.notice.set(null);

    const editingId = this.editingId();
    const request$ =
      editingId === null ? this.fleet.create(payload) : this.fleet.update(editingId, payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.notice.set(editingId === null ? 'Vehicle added to your fleet.' : 'Vehicle updated.');
        this.resetForm();
        this.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'Could not save the vehicle.'));
      },
    });
  }

  protected edit(vehicle: Vehicle): void {
    this.editingId.set(vehicle.id);
    this.notice.set(null);
    this.error.set(null);
    this.form.patchValue({
      label: vehicle.label,
      plate: vehicle.plate,
      vehicle_type: vehicle.vehicle_type,
      body_type: vehicle.body_type,
      payload_kg: vehicle.payload_kg,
      volume_m3: vehicle.volume_m3,
      max_range_km: vehicle.max_range_km,
      length_m: vehicle.length_m,
      width_m: vehicle.width_m,
      height_m: vehicle.height_m,
      cargo_length_m: vehicle.cargo_length_m,
      cargo_width_m: vehicle.cargo_width_m,
      cargo_height_m: vehicle.cargo_height_m,
    });
  }

  protected cancelEdit(): void {
    this.resetForm();
  }

  protected remove(vehicle: Vehicle): void {
    if (!confirm(`Remove ${vehicle.label} (${vehicle.plate}) from your fleet?`)) {
      return;
    }

    this.error.set(null);
    this.notice.set(null);
    this.fleet.remove(vehicle.id).subscribe({
      next: () => {
        this.notice.set('Vehicle removed.');
        if (this.editingId() === vehicle.id) {
          this.resetForm();
        }
        this.reload();
      },
      error: (error: unknown) => this.error.set(apiErrorMessage(error, 'Could not remove the vehicle.')),
    });
  }

  private buildPayload(): VehicleInput {
    const value = this.form.getRawValue();
    return {
      label: value.label.trim(),
      plate: value.plate.trim().toUpperCase(),
      vehicle_type: value.vehicle_type,
      body_type: value.body_type,
      payload_kg: Number(value.payload_kg),
      volume_m3: value.volume_m3 === null ? null : Number(value.volume_m3),
      max_range_km: value.max_range_km === null ? null : Number(value.max_range_km),
      length_m: value.length_m === null ? null : Number(value.length_m),
      width_m: value.width_m === null ? null : Number(value.width_m),
      height_m: value.height_m === null ? null : Number(value.height_m),
      cargo_length_m: value.cargo_length_m === null ? null : Number(value.cargo_length_m),
      cargo_width_m: value.cargo_width_m === null ? null : Number(value.cargo_width_m),
      cargo_height_m: value.cargo_height_m === null ? null : Number(value.cargo_height_m),
    };
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.form.reset({
      label: '',
      plate: '',
      vehicle_type: 'articulated_truck',
      body_type: 'curtain_side',
      payload_kg: null,
      volume_m3: null,
      max_range_km: null,
      length_m: null,
      width_m: null,
      height_m: null,
      cargo_length_m: null,
      cargo_width_m: null,
      cargo_height_m: null,
    });
  }

  private reload(): void {
    this.loading.set(true);
    forkJoin({
      list: this.fleet.list(),
      options: this.fleet.vehicleOptions(),
    }).subscribe({
      next: ({ list, options }: { list: { items: Vehicle[] }; options: VehicleOptions }) => {
        this.vehicles.set(list.items);
        this.vehicleTypes.set(options.vehicle_types);
        this.bodyTypes.set(options.body_types);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(error, 'Could not load your fleet.'));
      },
    });
  }
}

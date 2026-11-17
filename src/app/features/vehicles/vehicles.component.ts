import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormField,
  FormRoot,
  TreeValidationResult,
  form,
  max,
  maxLength,
  min,
  minLength,
  required,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom, forkJoin } from 'rxjs';

import { FleetService } from '../../core/fleet/fleet.service';
import { BodyType, OptionItem, Vehicle, VehicleInput, VehicleType } from '../../core/models';
import { apiErrorMessage } from '../../core/utils/api-error.util';
import { errorOf } from '../../core/utils/form-error.util';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/confirm-dialog/confirm-dialog.component';

interface VehicleModel {
  label: string;
  plate: string;
  vehicle_type: VehicleType;
  body_type: BodyType;
  payload_kg: number | null;
  volume_m3: number | null;
  max_range_km: number | null;
  length_m: number | null;
  width_m: number | null;
  height_m: number | null;
  cargo_length_m: number | null;
  cargo_width_m: number | null;
  cargo_height_m: number | null;
}

const EMPTY_VEHICLE: VehicleModel = {
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
};

@Component({
  selector: 'app-vehicles',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatProgressBarModule,
    FormRoot,
    FormField,
  ],
  templateUrl: './vehicles.component.html',
})
export class VehiclesComponent implements OnInit {
  private readonly fleetService = inject(FleetService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly vehicles = signal<Vehicle[]>([]);
  protected readonly vehicleTypes = signal<OptionItem[]>([]);
  protected readonly bodyTypes = signal<OptionItem[]>([]);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly editingId = signal<number | null>(null);
  protected readonly errorOf = errorOf;

  protected readonly model = signal<VehicleModel>({ ...EMPTY_VEHICLE });

  protected readonly vehicleForm = form(
    this.model,
    (path) => {
      required(path.label, { message: 'Give the vehicle a name' });
      maxLength(path.label, 80, { message: 'Up to 80 characters' });

      required(path.plate, { message: 'Plate is required' });
      minLength(path.plate, 3, { message: '3–20 characters' });
      maxLength(path.plate, 20, { message: '3–20 characters' });

      required(path.payload_kg, { message: 'Payload is required' });
      min(path.payload_kg, 1, { message: 'At least 1 kg' });
      max(path.payload_kg, 60000, { message: 'Up to 60 000 kg' });
    },
    {
      submission: {
        action: async (): Promise<TreeValidationResult> => {
          this.error.set(null);
          const editingId = this.editingId();
          const payload = this.buildPayload();

          try {
            if (editingId === null) {
              await firstValueFrom(this.fleetService.create(payload));
              this.notify('Vehicle added to your fleet.');
            } else {
              await firstValueFrom(this.fleetService.update(editingId, payload));
              this.notify('Vehicle updated.');
            }
            this.resetForm();
            this.reload();
          } catch (error: unknown) {
            this.error.set(apiErrorMessage(error, 'Could not save the vehicle.'));
          }
          return undefined;
        },
      },
    },
  );

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

  protected edit(vehicle: Vehicle): void {
    this.error.set(null);
    this.editingId.set(vehicle.id);
    this.model.set({
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

  protected async remove(vehicle: Vehicle): Promise<void> {
    const confirmed = await firstValueFrom(
      this.dialog
        .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
          data: {
            title: 'Remove vehicle',
            message: `Remove ${vehicle.label} (${vehicle.plate}) from your fleet?`,
            confirmLabel: 'Remove',
          },
        })
        .afterClosed(),
    );

    if (!confirmed) {
      return;
    }

    this.error.set(null);
    this.fleetService.remove(vehicle.id).subscribe({
      next: () => {
        this.notify('Vehicle removed.');
        if (this.editingId() === vehicle.id) {
          this.resetForm();
        }
        this.reload();
      },
      error: (error: unknown) =>
        this.error.set(apiErrorMessage(error, 'Could not remove the vehicle.')),
    });
  }

  private notify(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: 3000 });
  }

  private buildPayload(): VehicleInput {
    const value = this.model();
    return {
      ...value,
      label: value.label.trim(),
      plate: value.plate.trim().toUpperCase(),
      payload_kg: Number(value.payload_kg),
    };
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.model.set({ ...EMPTY_VEHICLE });
    // Clearing touched/dirty keeps the freshly emptied form from flashing validation errors.
    this.vehicleForm().reset();
  }

  private reload(): void {
    this.loading.set(true);
    forkJoin({
      list: this.fleetService.list(),
      options: this.fleetService.vehicleOptions(),
    }).subscribe({
      next: ({ list, options }) => {
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

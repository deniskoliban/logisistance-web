import { Component, OnInit, computed, effect, inject, signal, viewChild } from '@angular/core';
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
  validate,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom, forkJoin } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { FleetService } from '../../core/fleet/fleet.service';
import {
  BodyType,
  CargoShape,
  CatalogMake,
  CountryOption,
  OptionItem,
  Vehicle,
  VehicleInput,
  VehicleType,
} from '../../core/models';
import { apiErrorMessage } from '../../core/utils/api-error.util';
import { MatchableOption, OptionGroup } from '../../shared/directives/autocomplete-match.util';
import { OptionFieldComponent } from '../../shared/option-field/option-field.component';
import { sortedCountryOptions } from '../../core/utils/country.util';
import { latinText } from '../../core/utils/latin.util';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/confirm-dialog/confirm-dialog.component';
import { FormErrorPipe } from '../../shared/pipes/form-error.pipe';
import { LocalizedNumberPipe } from '../../shared/pipes/localized-number.pipe';
import { PluralPipe } from '../../shared/pipes/plural.pipe';

const CURRENT_YEAR = new Date().getFullYear();

/** 17 characters, ISO 3779 alphabet: no I, O or Q. The check digit is not validated. */
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

interface VehicleModel {
  make: string;
  model: string;
  modification: string;
  model_year: number;
  vin: string;
  plate: string;
  registration_country: string;
  vehicle_type: VehicleType;
  body_type: BodyType;
  payload_kg: number | null;
  volume_m3: number | null;
  max_range_km: number | null;
  cargo_shape: CargoShape;
  cargo_length_m: number | null;
  cargo_width_m: number | null;
  cargo_height_m: number | null;
}

function emptyVehicle(country: string): VehicleModel {
  return {
    make: '',
    model: '',
    modification: '',
    model_year: CURRENT_YEAR,
    vin: '',
    plate: '',
    registration_country: country,
    vehicle_type: 'articulated_truck',
    body_type: 'curtain_side',
    payload_kg: null,
    volume_m3: null,
    max_range_km: null,
    cargo_shape: 'box',
    cargo_length_m: null,
    cargo_width_m: null,
    cargo_height_m: null,
  };
}

/** Bounds for a number the driver may leave empty: an empty field is never an error. */
function outOfRange(
  value: number | null,
  low: number,
  high: number,
): { kind: 'min'; min: number } | { kind: 'max'; max: number } | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (value < low) {
    return { kind: 'min', min: low };
  }
  if (value > high) {
    return { kind: 'max', max: high };
  }
  return null;
}

/** Catalogue entry as an autocomplete option: the driver types and reads the name, never the code. */
function toMatchable(entry: { name: string }): MatchableOption {
  return { value: entry.name, viewValue: entry.name };
}

function vinIssue(value: string): { kind: string } | null {
  const vin = value.trim().toUpperCase();
  if (!vin) {
    return null;
  }
  if (vin.length !== 17) {
    return { kind: 'vinLength' };
  }
  return VIN_PATTERN.test(vin) ? null : { kind: 'vinFormat' };
}

/**
 * Fleet screen: the vehicle register form (two steps) and the list of registered vehicles.
 *
 * The form asks what the vehicle *is* (step 1: make, model, year, VIN, plate) and what it *can*
 * (step 2: body, payload, usable volume, cargo bay). Makes and models come from the API catalogue;
 * everything the catalogue cannot know — payload, volume, bay dimensions — comes from the driver's
 * registration document, which is why those fields carry the F.1 − G hint instead of a lookup.
 */
@Component({
  selector: 'app-vehicles',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    FormRoot,
    FormField,
    TranslocoPipe,
    FormErrorPipe,
    LocalizedNumberPipe,
    OptionFieldComponent,
    PluralPipe,
  ],
  templateUrl: './vehicles.component.html',
})
export class VehiclesComponent implements OnInit {
  private readonly fleetService = inject(FleetService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly transloco = inject(TranslocoService);

  protected readonly vehicles = signal<Vehicle[]>([]);
  protected readonly vehicleTypes = signal<OptionItem[]>([]);
  protected readonly bodyTypes = signal<OptionItem[]>([]);
  protected readonly countries = signal<CountryOption[]>([]);
  protected readonly makes = signal<CatalogMake[]>([]);

  protected readonly loading = signal(true);
  protected readonly editingId = signal<number | null>(null);
  protected readonly errorKey = signal<string | null>(null);
  protected readonly serverMessage = signal<string | null>(null);

  protected readonly currentYear = CURRENT_YEAR;

  /** Years offered newest first: a working carrier registers the truck he drives, not a 1985 one. */
  protected readonly yearOptions: number[] = Array.from(
    { length: CURRENT_YEAR + 1 - 1980 + 1 },
    (_, index) => CURRENT_YEAR + 1 - index,
  );

  protected readonly model = signal<VehicleModel>(
    emptyVehicle(this.authService.user()?.country ?? 'PL'),
  );

  /** The stepper is navigated programmatically when a submit fails on step 1. */
  private readonly stepper = viewChild(MatStepper);

  /** Curated makes first (they have nameplate families), everything else after, alphabetically. */
  protected readonly coreMakes = computed(() => this.makes().filter((make) => make.core));
  protected readonly otherMakes = computed(() => this.makes().filter((make) => !make.core));

  /** Countries come from the API in English and are not translated (`DECISIONS.md` D15). */
  protected readonly countryOptions = computed(() => sortedCountryOptions(this.countries()));

  /**
   * The form holds the *names* the driver reads ("MAN", "TGX"); the catalogue code is resolved from
   * them, exactly like the country field maps a name back to an ISO code.
   */
  protected readonly selectedMake = computed(
    () => this.makes().find((make) => make.name === this.model().make) ?? null,
  );
  protected readonly makeCode = computed(() => this.selectedMake()?.code ?? null);
  protected readonly selectedModel = computed(
    () => this.selectedMake()?.models.find((model) => model.name === this.model().model) ?? null,
  );
  protected readonly modelCode = computed(() => this.selectedModel()?.code ?? null);

  /** Searchable make picker: curated makes first, the rest alphabetically, as labelled blocks. */
  protected readonly makeGroups = computed<OptionGroup[]>(() => [
    { labelKey: 'vehicles.popularMakes', options: this.coreMakes().map(toMatchable) },
    { labelKey: 'vehicles.allMakes', options: this.otherMakes().map(toMatchable) },
  ]);

  /** Models of the chosen make; nothing to search until a make is resolved. */
  protected readonly modelGroups = computed<OptionGroup[]>(() => [
    { labelKey: null, options: (this.selectedMake()?.models ?? []).map(toMatchable) },
  ]);

  /** What the card will read, e.g. `MAN TGX 18.440, 2021` — the API computes the same string. */
  protected readonly previewName = computed(() => {
    const value = this.model();
    const parts = [value.make, value.model].filter((part) => part.trim());
    if (value.modification.trim()) {
      parts.push(value.modification.trim());
    }
    return parts.length ? `${parts.join(' ')}, ${value.model_year}` : '';
  });

  /**
   * Volume implied by the bay dimensions, shown as a grey sanity check — never written into the
   * field. For an irregular bay (wheel arches, sloped roof) the arithmetic overstates, so it is not
   * offered at all.
   */
  protected readonly computedVolume = computed(() => {
    const value = this.model();
    if (value.cargo_shape !== 'box') {
      return null;
    }
    const { cargo_length_m, cargo_width_m, cargo_height_m } = value;
    if (!cargo_length_m || !cargo_width_m || !cargo_height_m) {
      return null;
    }
    return cargo_length_m * cargo_width_m * cargo_height_m;
  });

  protected readonly vehicleForm = form(
    this.model,
    (path) => {
      required(path.make);
      required(path.model);
      // The fields hold text, so a make the catalogue does not know must not pass. Only a complete
      // name resolves: a half-typed "Ma" stays free text and fails here, which is the point.
      validate(path.make, ({ value }) =>
        this.makeCodeFor(value()) ? null : { kind: 'makeUnknown' },
      );
      validate(path.model, ({ value }) =>
        this.modelCodeFor(value()) ? null : { kind: 'modelUnknown' },
      );
      required(path.registration_country);

      required(path.plate);
      minLength(path.plate, 3);
      maxLength(path.plate, 20);
      validate(path.plate, ({ value }) => latinText(value()));

      maxLength(path.modification, 40);
      validate(path.modification, ({ value }) => latinText(value()));

      required(path.model_year);
      min(path.model_year, 1980);
      max(path.model_year, CURRENT_YEAR + 1);

      validate(path.vin, ({ value }) => vinIssue(value()));

      required(path.payload_kg);
      min(path.payload_kg, 1);
      max(path.payload_kg, 60_000);

      validate(path.volume_m3, ({ value }) => outOfRange(value(), 0.1, 300));
      validate(path.max_range_km, ({ value }) => outOfRange(value(), 1, 5_000));
      validate(path.cargo_length_m, ({ value }) => outOfRange(value(), 0.1, 40));
      validate(path.cargo_width_m, ({ value }) => outOfRange(value(), 0.1, 40));
      validate(path.cargo_height_m, ({ value }) => outOfRange(value(), 0.1, 40));
    },
    {
      submission: {
        action: async (): Promise<TreeValidationResult> => {
          this.errorKey.set(null);
          this.serverMessage.set(null);
          const editingId = this.editingId();
          const payload = this.buildPayload();

          try {
            if (editingId === null) {
              await firstValueFrom(this.fleetService.create(payload));
              this.notify('vehicles.added');
            } else {
              await firstValueFrom(this.fleetService.update(editingId, payload));
              this.notify('vehicles.updated');
            }
            this.resetForm();
            this.reload();
          } catch (error: unknown) {
            this.serverMessage.set(
              apiErrorMessage(error, this.transloco.translate('errors.vehicleSaveFailed')),
            );
          }
          return undefined;
        },
      },
    },
  );

  ngOnInit(): void {
    this.reload();
  }

  protected edit(vehicle: Vehicle): void {
    this.errorKey.set(null);
    this.serverMessage.set(null);
    this.editingId.set(vehicle.id);
    this.model.set({
      // The API hands back the names behind the codes, so editing needs no catalogue lookup.
      make: vehicle.make_name,
      model: vehicle.model_name,
      modification: vehicle.modification ?? '',
      model_year: vehicle.model_year,
      vin: vehicle.vin ?? '',
      plate: vehicle.plate,
      registration_country: vehicle.registration_country,
      vehicle_type: vehicle.vehicle_type,
      body_type: vehicle.body_type,
      payload_kg: vehicle.payload_kg,
      volume_m3: vehicle.volume_m3,
      max_range_km: vehicle.max_range_km,
      cargo_shape: vehicle.cargo_shape,
      cargo_length_m: vehicle.cargo_length_m,
      cargo_width_m: vehicle.cargo_width_m,
      cargo_height_m: vehicle.cargo_height_m,
    });
    this.goToStep(0);
  }

  protected cancelEdit(): void {
    this.resetForm();
  }

  /** Previous make text, so the model is cleared on a make *change* and never while typing a model. */
  private lastMake: string | undefined;

  constructor() {
    // Models belong to a make: changing the make drops a model the new make does not offer. Comparing
    // with the previous make (instead of validating on every change) is what keeps a half-typed model
    // name from being wiped on each keystroke.
    effect(() => {
      const make = this.model().make;
      const changed = this.lastMake !== undefined && this.lastMake !== make;
      this.lastMake = make;
      if (!changed) {
        return;
      }
      const modelName = this.model().model;
      if (!modelName.trim()) {
        return;
      }
      const makeEntry = this.selectedMake();
      if (!makeEntry || !makeEntry.models.some((model) => model.name === modelName)) {
        this.model.update((value) => ({ ...value, model: '' }));
      }
    });
  }

  private makeCodeFor(name: string): string | null {
    return this.makes().find((make) => make.name === name.trim())?.code ?? null;
  }

  private modelCodeFor(name: string): string | null {
    const make = this.makes().find((entry) => entry.name === this.model().make.trim());
    return make?.models.find((model) => model.name === name.trim())?.code ?? null;
  }

  /** A failed submit on step 1 must not leave the person staring at step 2. */
  protected focusInvalidStep(): void {
    const state = this.vehicleForm;
    const identityFields = [
      state.make,
      state.model,
      state.registration_country,
      state.plate,
      state.model_year,
      state.vin,
      state.modification,
    ];
    if (identityFields.some((field) => field().invalid())) {
      this.goToStep(0);
    }
  }

  protected goToStep(index: number): void {
    const stepper = this.stepper();
    if (stepper) {
      stepper.selectedIndex = index;
    }
  }

  protected async remove(vehicle: Vehicle): Promise<void> {
    const confirmed = await firstValueFrom(
      this.dialog
        .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
          data: {
            title: this.transloco.translate('vehicles.removeTitle'),
            message: this.transloco.translate('vehicles.removeMessage', {
              label: vehicle.display_name,
              plate: vehicle.plate,
            }),
            confirmLabel: this.transloco.translate('actions.remove'),
          },
        })
        .afterClosed(),
    );

    if (!confirmed) {
      return;
    }

    this.errorKey.set(null);
    this.serverMessage.set(null);
    this.fleetService.remove(vehicle.id).subscribe({
      next: () => {
        this.notify('vehicles.removed');
        if (this.editingId() === vehicle.id) {
          this.resetForm();
        }
        this.reload();
      },
      error: (error: unknown) =>
        this.serverMessage.set(
          apiErrorMessage(error, this.transloco.translate('errors.vehicleRemoveFailed')),
        ),
    });
  }

  private notify(key: string): void {
    this.snackBar.open(this.transloco.translate(key), undefined, { duration: 3000 });
  }

  private buildPayload(): VehicleInput {
    const value = this.model();
    return {
      // The field text is what the driver reads; the API stores catalogue codes.
      make: this.makeCode() ?? '',
      model: this.modelCode() ?? '',
      modification: value.modification.trim() || null,
      model_year: Number(value.model_year),
      vin: value.vin.trim().toUpperCase() || null,
      plate: value.plate.trim().toUpperCase(),
      registration_country: value.registration_country.toUpperCase(),
      vehicle_type: value.vehicle_type,
      body_type: value.body_type,
      payload_kg: Number(value.payload_kg),
      volume_m3: value.volume_m3,
      max_range_km: value.max_range_km,
      cargo_shape: value.cargo_shape,
      cargo_length_m: value.cargo_length_m,
      cargo_width_m: value.cargo_width_m,
      cargo_height_m: value.cargo_height_m,
    };
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.model.set(emptyVehicle(this.authService.user()?.country ?? 'PL'));
    // Clearing touched/dirty keeps the freshly emptied form from flashing validation errors.
    this.vehicleForm().reset();
    this.goToStep(0);
  }

  private reload(): void {
    this.loading.set(true);
    forkJoin({
      list: this.fleetService.list(),
      options: this.fleetService.vehicleOptions(),
      catalog: this.fleetService.vehicleCatalog(),
      countries: this.fleetService.countries(),
    }).subscribe({
      next: ({ list, options, catalog, countries }) => {
        this.vehicles.set(list.items);
        this.vehicleTypes.set(options.vehicle_types);
        this.bodyTypes.set(options.body_types);
        this.countries.set(countries);
        this.makes.set(catalog.makes);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.serverMessage.set(
          apiErrorMessage(error, this.transloco.translate('errors.fleetLoadFailed')),
        );
      },
    });
  }
}

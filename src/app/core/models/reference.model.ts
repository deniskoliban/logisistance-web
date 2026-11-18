export interface CountryOption {
  code: string;
  name: string;
}

export interface OptionItem {
  value: string;
  label: string;
}

export interface VehicleOptions {
  vehicle_types: OptionItem[];
  body_types: OptionItem[];
  cargo_shapes: OptionItem[];
}

export interface CatalogModel {
  code: string;
  name: string;
}

export interface CatalogMake {
  code: string;
  name: string;
  /** Curated makes: model families instead of register noise, and shown first in the picker. */
  core: boolean;
  kinds: string[];
  models: CatalogModel[];
}

export interface VehicleCatalog {
  /** Licence notice for the generated dataset (CC BY 4.0, VehiclesDB). */
  source: string;
  makes: CatalogMake[];
}

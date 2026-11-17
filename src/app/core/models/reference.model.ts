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
}

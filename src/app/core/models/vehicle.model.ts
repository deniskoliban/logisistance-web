export type VehicleType = 'van' | 'rigid_truck' | 'articulated_truck' | 'tractor_unit' | 'trailer';

export type BodyType =
  'box' | 'curtain_side' | 'refrigerated' | 'flatbed' | 'tipper' | 'tanker' | 'other';

/** Whether the cargo bay is a plain box or has arches/slopes eating into the usable volume. */
export type CargoShape = 'box' | 'irregular';

export interface Vehicle {
  id: number;
  owner_id: number;
  /** Catalogue code, e.g. `man`. */
  make: string;
  /** Catalogue code, e.g. `tgx`. */
  model: string;
  /** Free text after the model: `18.440`, `Cargo Maxi XL`, `H2 L3`. */
  modification: string | null;
  model_year: number;
  vin: string | null;
  plate: string;
  registration_country: string;
  vehicle_type: VehicleType;
  body_type: BodyType;
  payload_kg: number;
  volume_m3: number | null;
  max_range_km: number | null;
  cargo_shape: CargoShape;
  cargo_length_m: number | null;
  cargo_width_m: number | null;
  cargo_height_m: number | null;
  /** Names behind the codes, resolved by the API — the client never guesses them. */
  make_name: string;
  model_name: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleInput {
  make: string;
  model: string;
  modification: string | null;
  model_year: number;
  vin: string | null;
  plate: string;
  registration_country: string;
  vehicle_type: VehicleType;
  body_type: BodyType;
  payload_kg: number;
  volume_m3: number | null;
  max_range_km: number | null;
  cargo_shape: CargoShape;
  cargo_length_m: number | null;
  cargo_width_m: number | null;
  cargo_height_m: number | null;
}

export interface VehicleList {
  items: Vehicle[];
  total: number;
}

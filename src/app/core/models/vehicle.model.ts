export type VehicleType =
  | 'van'
  | 'rigid_truck'
  | 'articulated_truck'
  | 'tractor_unit'
  | 'trailer';

export type BodyType =
  | 'box'
  | 'curtain_side'
  | 'refrigerated'
  | 'flatbed'
  | 'tipper'
  | 'tanker'
  | 'other';

export interface Vehicle {
  id: number;
  owner_id: number;
  label: string;
  plate: string;
  vehicle_type: VehicleType;
  body_type: BodyType;
  payload_kg: number;
  volume_m3: number | null;
  max_range_km: number | null;
  length_m: number | null;
  width_m: number | null;
  height_m: number | null;
  cargo_length_m: number | null;
  cargo_width_m: number | null;
  cargo_height_m: number | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleInput {
  label: string;
  plate: string;
  vehicle_type: VehicleType;
  body_type: BodyType;
  payload_kg: number;
  volume_m3: number | null;
  max_range_km: number | null;
  length_m: number | null;
  width_m: number | null;
  height_m: number | null;
  cargo_length_m: number | null;
  cargo_width_m: number | null;
  cargo_height_m: number | null;
}

export interface VehicleList {
  items: Vehicle[];
  total: number;
}

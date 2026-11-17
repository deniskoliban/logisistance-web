export const API_BASE = '/api/v1';

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

export interface User {
  id: number;
  email: string;
  full_name: string;
  age: number;
  country: string;
  city: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  age: number;
  country: string;
  city: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ProfileUpdate {
  full_name?: string;
  age?: number;
  country?: string;
  city?: string;
}

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
  volume_m3?: number | null;
  max_range_km?: number | null;
  length_m?: number | null;
  width_m?: number | null;
  height_m?: number | null;
  cargo_length_m?: number | null;
  cargo_width_m?: number | null;
  cargo_height_m?: number | null;
}

export interface VehicleList {
  items: Vehicle[];
  total: number;
}

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

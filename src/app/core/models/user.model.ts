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

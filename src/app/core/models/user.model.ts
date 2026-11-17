export interface User {
  id: number;
  email: string;
  full_name: string;
  /** ISO date, e.g. 1985-04-12. */
  date_of_birth: string;
  /** Derived by the API from date_of_birth. */
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
  date_of_birth: string;
  country: string;
  city: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ProfileUpdate {
  full_name?: string;
  date_of_birth?: string;
  country?: string;
  city?: string;
}

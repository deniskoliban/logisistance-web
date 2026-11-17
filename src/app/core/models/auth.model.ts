import { User } from './user.model';

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface StoredSession {
  token: string;
  user: User;
}

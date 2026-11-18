import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import {
  API_BASE,
  AuthResponse,
  LoginPayload,
  ProfileUpdate,
  RegisterPayload,
  StoredSession,
  User,
} from '../models';

const STORAGE_KEY = 'efla.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<User | null>(null);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);

  constructor() {
    this.restore();
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE}/auth/register`, payload)
      .pipe(tap((response) => this.store(response)));
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE}/auth/login`, payload)
      .pipe(tap((response) => this.store(response)));
  }

  refreshProfile(): Observable<User> {
    return this.http.get<User>(`${API_BASE}/users/me`).pipe(tap((user) => this.patchUser(user)));
  }

  updateProfile(payload: ProfileUpdate): Observable<User> {
    return this.http
      .patch<User>(`${API_BASE}/users/me`, payload)
      .pipe(tap((user) => this.patchUser(user)));
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem(STORAGE_KEY);
    void this.router.navigate(['/login']);
  }

  private store(response: AuthResponse): void {
    this._token.set(response.access_token);
    this._user.set(response.user);
    this.persist(response.access_token, response.user);
  }

  private patchUser(user: User): void {
    this._user.set(user);
    const token = this._token();
    if (token) {
      this.persist(token, user);
    }
  }

  private persist(token: string, user: User): void {
    const session: StoredSession = { token, user };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  private restore(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const session = JSON.parse(raw) as StoredSession;
      if (session?.token && session?.user) {
        this._token.set(session.token);
        this._user.set(session.user);
        return;
      }
    } catch {
      // fall through to cleanup
    }
    localStorage.removeItem(STORAGE_KEY);
  }
}

import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { AuthResponse } from '../models/auth-response.model';
import { User } from '../models/user.model';

/** Handles authentication and the current user's profile. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly token = signal<string | null>(localStorage.getItem('gpc_token'));
  readonly currentUser = signal<User | null>(this.getStoredUser());
  readonly isAuthenticated = computed(() => !!this.token());

  constructor() {
    // Si un jeton est présent, on synchronise le profil en arrière-plan
    // via setTimeout pour laisser Angular terminer l'instanciation de l'injecteur
    if (this.token()) {
      setTimeout(() => {
        this.profile().subscribe({
          error: (err) => console.debug('[AuthService] Synchronisation arrière-plan', err),
        });
      }, 0);
    }
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>('/api/auth/login', { email, password })
      .pipe(tap((response) => this.storeAuthentication(response)));
  }

  register(name: string, email: string, password: string) {
    return this.http
      .post<AuthResponse>('/api/auth/register', { name, email, password })
      .pipe(tap((response) => this.storeAuthentication(response)));
  }

  profile() {
    return this.http
      .get<User>('/api/users/me')
      .pipe(
        tap((user) => {
          this.currentUser.set(user);
          localStorage.setItem('gpc_user', JSON.stringify(user));
        }),
      );
  }

  update(name: string) {
    return this.http
      .put<User>('/api/users/me', { name })
      .pipe(
        tap((user) => {
          this.currentUser.set(user);
          localStorage.setItem('gpc_user', JSON.stringify(user));
        }),
      );
  }

  logout(): void {
    localStorage.removeItem('gpc_token');
    localStorage.removeItem('gpc_user');
    this.token.set(null);
    this.currentUser.set(null);
  }

  private storeAuthentication(response: AuthResponse): void {
    localStorage.setItem('gpc_token', response.token);
    localStorage.setItem('gpc_user', JSON.stringify(response.user));
    this.token.set(response.token);
    this.currentUser.set(response.user);
  }

  private getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem('gpc_user');
      return stored ? JSON.parse(stored) as User : null;
    } catch {
      return null;
    }
  }
}



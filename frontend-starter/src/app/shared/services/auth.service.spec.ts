import '../../../test-setup';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthService } from './auth.service';
import { AuthResponse } from '../models/auth-response.model';
import { User } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('login() doit appeler POST /api/auth/login avec les bons identifiants et mettre a jour les signals', () => {
    const mockUser: User = {
      id: 'usr-1',
      name: 'Hendrix',
      email: 'hendrix@test.com',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    const mockResponse: AuthResponse = {
      token: 'fake-jwt-token-12345',
      user: mockUser,
    };

    service.login('hendrix@test.com', 'Secret123!').subscribe((res) => {
      expect(res.token).toBe('fake-jwt-token-12345');
      expect(res.user.name).toBe('Hendrix');
    });

    const req = httpTesting.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'hendrix@test.com',
      password: 'Secret123!',
    });

    req.flush(mockResponse);

    // Vérification de la mise à jour des Signals réactifs
    expect(service.token()).toBe('fake-jwt-token-12345');
    expect(service.currentUser()?.name).toBe('Hendrix');
    expect(service.isAuthenticated()).toBe(true);
    expect(localStorage.getItem('gpc_token')).toBe('fake-jwt-token-12345');
  });

  it('logout() doit vider les signaux et le stockage local', () => {
    service.token.set('temp-token');
    service.currentUser.set({
      id: '1',
      name: 'User',
      email: 'user@test.com',
      createdAt: '2026-01-01',
    });
    localStorage.setItem('gpc_token', 'temp-token');

    service.logout();

    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('gpc_token')).toBeNull();
  });
});

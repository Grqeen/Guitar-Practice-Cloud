import '../../../test-setup';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideRouter([{ path: 'login', component: class DummyComponent {} }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it("doit ajouter l'en-tete Authorization Bearer quand un token est present", () => {
    authService.token.set('mon-jeton-jwt-secret');

    http.get('/api/users/me').subscribe();

    const req = httpTesting.expectOne('/api/users/me');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer mon-jeton-jwt-secret');

    req.flush({ id: '1', name: 'Guitariste' });
  });

  it("ne doit pas ajouter d'en-tete Authorization quand aucun token n'existe", () => {
    authService.token.set(null);

    http.get('/api/health').subscribe();

    const req = httpTesting.expectOne('/api/health');
    expect(req.request.headers.has('Authorization')).toBe(false);

    req.flush({ status: 'ok' });
  });

  it('doit declencher logout() lors d une reponse 401 Unauthorized', () => {
    authService.token.set('jeton-expire');

    http.get('/api/tracks').subscribe({
      next: () => {},
      error: (err) => {
        expect(err.status).toBe(401);
      },
    });

    const req = httpTesting.expectOne('/api/tracks');
    req.flush({ message: 'Token expiré' }, { status: 401, statusText: 'Unauthorized' });

    // Le service doit avoir réinitialisé le token
    expect(authService.token()).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
  });
});

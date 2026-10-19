import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { GenericResponse, LoginRequest, UsuarioJwt } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly storageKey = 'auth_session';
  private currentUserSignal = signal<UsuarioJwt | null>(this.loadStoredUser());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.roles.includes('ADMIN') ?? false);
  readonly isVendedor = computed(() => this.currentUserSignal()?.roles.includes('VENDEDOR') ?? false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: LoginRequest): Observable<GenericResponse<UsuarioJwt>> {
    return this.http.post<GenericResponse<UsuarioJwt>>(`${environment.apiAuth}/login`, credentials).pipe(
      tap(res => {
        if (res && res.response && res.response.token) {
          this.saveSession(res.response);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.currentUserSignal()?.token ?? null;
  }

  private saveSession(user: UsuarioJwt): void {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  private loadStoredUser(): UsuarioJwt | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}

import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50">

      <!-- Panel de marca -->
      <div class="hidden lg:flex relative flex-col justify-between p-12 text-white overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950">
        <div class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl"></div>
        <div class="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-cyan-500/10 blur-3xl"></div>

        <div class="relative flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-xl shadow-lg shadow-blue-900/40">⛽</div>
          <div>
            <p class="text-lg font-bold tracking-wide leading-tight">Gases Industriales</p>
            <p class="text-xs text-slate-400">Sistema de Facturación</p>
          </div>
        </div>

        <div class="relative space-y-8 max-w-md">
          <div class="space-y-3">
            <h1 class="text-4xl font-extrabold leading-tight">
              Facturación electrónica<br />
              <span class="text-blue-400">simple y confiable.</span>
            </h1>
            <p class="text-slate-400 text-sm leading-relaxed">
              Emite comprobantes a SUNAT, controla tu stock de gases y gestiona a tus clientes desde un solo panel.
            </p>
          </div>

          <ul class="space-y-4 text-sm">
            <li class="flex items-start gap-3">
              <span class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">🧾</span>
              <div>
                <p class="font-semibold text-slate-100">Emisión directa a SUNAT</p>
                <p class="text-xs text-slate-400">Facturas individuales o por lote, con seguimiento de estado.</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">📦</span>
              <div>
                <p class="font-semibold text-slate-100">Stock en tiempo real</p>
                <p class="text-xs text-slate-400">El inventario se descuenta al aceptarse cada comprobante.</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">📊</span>
              <div>
                <p class="font-semibold text-slate-100">Métricas del negocio</p>
                <p class="text-xs text-slate-400">Ventas, IGV, clientes principales y alertas de inventario.</p>
              </div>
            </li>
          </ul>
        </div>

        <p class="relative text-xs text-slate-500">© {{ anio }} Gases Industriales. Todos los derechos reservados.</p>
      </div>

      <!-- Formulario -->
      <div class="flex items-center justify-center p-6 sm:p-12">
        <div class="w-full max-w-md space-y-8">

          <!-- Marca en móvil -->
          <div class="lg:hidden flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-xl text-white">⛽</div>
            <div>
              <p class="text-lg font-bold text-slate-800 leading-tight">Gases Industriales</p>
              <p class="text-xs text-slate-500">Sistema de Facturación</p>
            </div>
          </div>

          <div class="space-y-1">
            <h2 class="text-3xl font-bold text-slate-900">Bienvenido</h2>
            <p class="text-sm text-slate-500">Ingresa tus credenciales para acceder al sistema.</p>
          </div>

          @if (errorMessage) {
            <div class="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-start gap-2.5">
              <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ errorMessage }}</span>
            </div>
          }

          <form (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label for="username" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Usuario
              </label>
              <div class="relative">
                <svg class="w-5 h-5 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input id="username" type="text" [(ngModel)]="credentials.username" name="username" required
                       autocomplete="username" placeholder="Ingrese su usuario"
                       class="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition" />
              </div>
            </div>

            <div>
              <label for="password" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div class="relative">
                <svg class="w-5 h-5 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input id="password" [type]="mostrarPassword ? 'text' : 'password'" [(ngModel)]="credentials.password"
                       name="password" required autocomplete="current-password" placeholder="••••••••••••"
                       class="w-full pl-11 pr-16 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition" />
                <button type="button" (click)="togglePassword()"
                        class="absolute right-3 top-2 px-2 py-1 text-xs font-semibold text-slate-500 hover:text-blue-600 rounded-md transition">
                  {{ mostrarPassword ? 'Ocultar' : 'Mostrar' }}
                </button>
              </div>
            </div>

            <button type="submit" [disabled]="loading"
                    class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
              @if (loading) {
                <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Ingresando...</span>
              } @else {
                <span>Iniciar sesión</span>
              }
            </button>
          </form>

          <p class="text-center text-xs text-slate-400">
            Acceso restringido a personal autorizado.
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  credentials: LoginRequest = {
    username: '',
    password: ''
  };

  loading = false;
  errorMessage = '';
  mostrarPassword = false;
  anio = new Date().getFullYear();

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (!this.credentials.username || !this.credentials.password) {
      this.errorMessage = 'Por favor complete todos los campos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.loading = false;
        if (res && res.response && res.response.token) {
          this.router.navigate(['/dashboard']);
        } else if (res && res.error) {
          this.errorMessage = res.error.message || 'Credenciales incorrectas';
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 401) {
          this.errorMessage = 'Usuario o contraseña incorrectos';
        } else if (err.status === 0) {
          this.errorMessage = 'No se pudo conectar con el Gateway (puerto 8090)';
        } else {
          this.errorMessage = err.error?.error?.message || 'Error al autenticar con el servidor';
        }
        this.cdr.markForCheck();
      }
    });
  }
}
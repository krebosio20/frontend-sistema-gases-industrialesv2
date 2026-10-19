import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-slate-50 font-sans">
      <aside class="w-64 bg-slate-900 text-white flex flex-col justify-between">
        <div>
          <div class="p-5 border-b border-slate-800">
            <h1 class="text-lg font-bold tracking-wide text-blue-400">Gases Industriales</h1>
            <p class="text-xs text-slate-400">Sistema de Facturación</p>
          </div>
          <nav class="p-4 space-y-1">
            <a routerLink="/dashboard" routerLinkActive="bg-blue-600 text-white" 
               class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              <span>Inicio</span>
            </a>
            <a routerLink="/clientes" routerLinkActive="bg-blue-600 text-white" 
               class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <span>Clientes</span>
            </a>
            <a routerLink="/productos" routerLinkActive="bg-blue-600 text-white" 
               class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <span>Productos y Stock</span>
            </a>
            <a routerLink="/facturas" routerLinkActive="bg-blue-600 text-white" 
               class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span>Emitir Factura</span>
            </a>
          </nav>
        </div>

        <div class="p-4 border-t border-slate-800 bg-slate-950/40">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2 overflow-hidden">
              <div class="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs uppercase flex-shrink-0">
                {{ userInitials }}
              </div>
              <div class="truncate">
                <p class="text-xs font-semibold text-slate-200 truncate">{{ authService.currentUser()?.nomusuario || 'Usuario' }}</p>
                <span class="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded"
                      [ngClass]="authService.isAdmin() ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50' : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'">
                  {{ userRoleLabel }}
                </span>
              </div>
            </div>
          </div>
          <button (click)="logout()"
                  class="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition border border-transparent hover:border-red-500/20">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <div class="flex-1 flex flex-col overflow-hidden">
        <header class="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
          <span class="text-sm font-medium text-slate-700">Módulo de Facturación Electrónica</span>
          <div class="flex items-center gap-3">
            <span class="text-xs text-slate-500">Sesión iniciada como: <strong class="text-slate-800">{{ authService.currentUser()?.nomusuario }}</strong></span>
            <span class="inline-block px-2 py-0.5 text-xs font-semibold rounded-full"
                  [ngClass]="authService.isAdmin() ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'">
              {{ userRoleLabel }}
            </span>
          </div>
        </header>

        <main class="flex-1 overflow-y-auto p-8 bg-slate-100">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class LayoutComponent {
  constructor(public authService: AuthService) {}

  get userInitials(): string {
    const user = this.authService.currentUser()?.nomusuario;
    return user ? user.substring(0, 2).toUpperCase() : 'US';
  }

  get userRoleLabel(): string {
    if (this.authService.isAdmin()) {
      return 'ADMINISTRADOR';
    }
    if (this.authService.isVendedor()) {
      return 'VENDEDOR';
    }
    return 'USUARIO';
  }

  logout(): void {
    this.authService.logout();
  }
}

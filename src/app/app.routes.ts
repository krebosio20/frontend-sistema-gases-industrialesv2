import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      {
        path: 'clientes',
        loadComponent: () => import('./components/clientes/clientes.component').then(m => m.ClientesComponent)
      },
      {
        path: 'productos',
        loadComponent: () => import('./components/productos/productos.component').then(m => m.ProductosComponent)
      },
      {
        path: 'facturas',
        loadComponent: () => import('./components/facturas/facturas.component').then(m => m.FacturasComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];

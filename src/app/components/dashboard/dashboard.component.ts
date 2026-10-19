import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexFill, ApexGrid, ApexLegend,
  ApexPlotOptions, ApexStroke, ApexTooltip, ApexXAxis, ApexYAxis, ChartComponent
} from 'ng-apexcharts';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule, ColDef, GridApi, GridReadyEvent, ICellRendererParams,
  ModuleRegistry, themeQuartz
} from 'ag-grid-community';

import { ClienteService } from '../../services/cliente.service';
import { ProductoService } from '../../services/producto.service';
import { FacturaService } from '../../services/factura.service';
import { AuthService } from '../../services/auth.service';
import { Cliente } from '../../models/cliente.model';
import { Producto } from '../../models/producto.model';
import { FacturaResponse } from '../../models/factura.model';

ModuleRegistry.registerModules([AllCommunityModule]);

const ESTADOS = ['ACEPTADO', 'PENDIENTE', 'RECHAZADO', 'EXCEPCION', 'ANULADO'];

const COLORES: Record<string, string> = {
  ACEPTADO: '#10b981',
  PENDIENTE: '#f59e0b',
  RECHAZADO: '#f97316',
  EXCEPCION: '#e11d48',
  ANULADO: '#94a3b8'
};

type Rango = '7' | '30' | '90' | 'TODO';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, FormsModule, ChartComponent, AgGridAngular],
  template: `
    <div class="space-y-6 transition-opacity" [class.opacity-60]="cargando()">

      <!-- Encabezado -->
      <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p class="text-xs font-semibold text-blue-600 uppercase tracking-wider">{{ fechaHoy }}</p>
          <h2 class="text-2xl font-bold text-slate-800">Hola, {{ usuario }}</h2>
          <p class="text-sm text-slate-500">Resumen de facturación electrónica, clientes y stock de gases industriales.</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="cargar()" [disabled]="cargando()"
                  class="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition">
            {{ cargando() ? 'Actualizando...' : 'Actualizar datos' }}
          </button>
          <a routerLink="/facturas"
             class="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition shadow-sm">
            + Nueva factura
          </a>
        </div>
      </div>

      <!-- Filtros globales -->
      <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Periodo</span>
          <div class="inline-flex p-1 bg-slate-100 rounded-lg text-xs">
            @for (r of rangos; track r.valor) {
              <button (click)="rango.set(r.valor)"
                      [class]="rango() === r.valor ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                      class="px-3 py-1.5 rounded-md font-semibold transition">
                {{ r.etiqueta }}
              </button>
            }
          </div>
        </div>

        <div class="flex items-center gap-2 md:ml-2">
          <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Cliente</span>
          <select [ngModel]="clienteFiltro()" (ngModelChange)="clienteFiltro.set($event)"
                  class="border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-700 max-w-[260px] focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <option [ngValue]="null">Todos los clientes</option>
            @for (c of clientes(); track c.idCliente) {
              <option [ngValue]="c.idCliente">{{ c.nombre }}</option>
            }
          </select>
        </div>

        <div class="md:ml-auto flex items-center gap-3">
          <span class="text-xs text-slate-500">{{ facturasF().length }} comprobantes en el periodo</span>
          <button (click)="limpiarFiltros()"
                  class="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
            Limpiar filtros
          </button>
        </div>
      </div>

      <!-- KPIs -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ventas aceptadas</p>
            <span class="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-base">💰</span>
          </div>
          <p class="text-2xl font-extrabold text-slate-800 mt-3 font-mono">S/ {{ ventasTotal() | number:'1.2-2' }}</p>
          <div class="flex items-center gap-2 mt-1.5">
            @if (variacionVentas() !== null) {
              <span class="text-[11px] font-bold px-1.5 py-0.5 rounded"
                    [class]="variacionVentas()! >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'">
                {{ variacionVentas()! >= 0 ? '▲' : '▼' }} {{ absVariacion() | number:'1.0-1' }}%
              </span>
              <span class="text-[11px] text-slate-400">vs. periodo anterior</span>
            } @else {
              <span class="text-xs text-slate-500">{{ aceptadas().length }} comprobantes aceptados</span>
            }
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">IGV generado</p>
            <span class="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-base">🧾</span>
          </div>
          <p class="text-2xl font-extrabold text-slate-800 mt-3 font-mono">S/ {{ igvTotal() | number:'1.2-2' }}</p>
          <p class="text-xs text-slate-500 mt-1.5">Ticket promedio: S/ {{ ticketPromedio() | number:'1.2-2' }}</p>
        </div>

        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tasa de aceptación</p>
            <span class="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-base">✅</span>
          </div>
          <p class="text-2xl font-extrabold text-slate-800 mt-3 font-mono">{{ tasaAceptacion() | number:'1.0-1' }}%</p>
          <div class="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" [style.width.%]="tasaAceptacion()"></div>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor de inventario</p>
            <span class="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-base">📦</span>
          </div>
          <p class="text-2xl font-extrabold text-slate-800 mt-3 font-mono">S/ {{ valorInventario() | number:'1.2-2' }}</p>
          <p class="text-xs text-slate-500 mt-1.5">{{ productosActivos() }} productos activos de {{ productos().length }}</p>
        </div>
      </div>

      <!-- Contadores -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <a routerLink="/clientes" class="bg-white px-5 py-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition">
          <p class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Clientes</p>
          <p class="text-xl font-bold text-slate-800 mt-1">{{ clientes().length }}</p>
        </a>
        <a routerLink="/facturas" class="bg-white px-5 py-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition">
          <p class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Facturas del periodo</p>
          <p class="text-xl font-bold text-slate-800 mt-1">{{ facturasF().length }}</p>
        </a>
        <a routerLink="/facturas" class="bg-white px-5 py-4 rounded-xl border border-slate-200 shadow-sm hover:border-amber-300 transition">
          <p class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pendientes</p>
          <p class="text-xl font-bold text-amber-600 mt-1">{{ conteo('PENDIENTE') }}</p>
        </a>
        <a routerLink="/facturas" class="bg-white px-5 py-4 rounded-xl border border-slate-200 shadow-sm hover:border-rose-300 transition">
          <p class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Con problemas</p>
          <p class="text-xl font-bold text-rose-600 mt-1">{{ conteo('RECHAZADO') + conteo('EXCEPCION') }}</p>
        </a>
      </div>

      <!-- Ventas + Estados -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-start justify-between mb-2">
            <div>
              <h3 class="text-base font-bold text-slate-800">Evolución de ventas</h3>
              <p class="text-xs text-slate-500">Comprobantes aceptados por SUNAT · {{ etiquetaGrafico() }}</p>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold font-mono">
              S/ {{ ventasGrafico() | number:'1.2-2' }}
            </span>
          </div>
          <apx-chart
            [series]="serieVentas()"
            [chart]="chartArea"
            [xaxis]="xaxisVentas()"
            [yaxis]="yaxisSoles"
            [stroke]="strokeArea"
            [fill]="fillArea"
            [colors]="coloresArea"
            [dataLabels]="sinEtiquetas"
            [grid]="grillaSuave"
            [tooltip]="tooltipSoles"></apx-chart>
        </div>

        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 class="text-base font-bold text-slate-800">Estado de comprobantes</h3>
          <p class="text-xs text-slate-500 mb-2">Distribución en el periodo</p>
          <apx-chart
            [series]="serieDonut()"
            [chart]="chartDonut"
            [labels]="etiquetasDonut"
            [colors]="coloresDonut"
            [plotOptions]="plotDonut()"
            [dataLabels]="sinEtiquetas"
            [stroke]="strokeDonut"
            [legend]="leyendaAbajo"></apx-chart>
        </div>
      </div>

      <!-- Top clientes + Stock + Alertas -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 class="text-base font-bold text-slate-800">Top clientes</h3>
          <p class="text-xs text-slate-500 mb-2">Facturación aceptada en el periodo</p>
          @if (topClientes().length > 0) {
            <apx-chart
              [series]="serieTop()"
              [chart]="chartBarra"
              [xaxis]="xaxisTop()"
              [yaxis]="yaxisTop"
              [plotOptions]="plotBarraH"
              [colors]="coloresArea"
              [dataLabels]="sinEtiquetas"
              [grid]="grillaSuave"
              [tooltip]="tooltipSoles"></apx-chart>
          } @else {
            <p class="text-sm text-slate-400 text-center py-16">Aún no hay facturas aceptadas.</p>
          }
        </div>

        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 class="text-base font-bold text-slate-800">Stock por producto</h3>
          <p class="text-xs text-slate-500 mb-2">Los 8 con menos unidades (activos)</p>
          @if (stockProductos().length > 0) {
            <apx-chart
              [series]="serieStock()"
              [chart]="chartBarra"
              [xaxis]="xaxisStock()"
              [plotOptions]="plotStock"
              [colors]="coloresStock()"
              [dataLabels]="etiquetasValor"
              [legend]="sinLeyenda"
              [grid]="grillaSuave"></apx-chart>
          } @else {
            <p class="text-sm text-slate-400 text-center py-16">No hay productos activos.</p>
          }
        </div>

        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-base font-bold text-slate-800">Alertas de stock</h3>
              <p class="text-xs text-slate-500">Activos con 10 unidades o menos</p>
            </div>
            <a routerLink="/productos" class="text-xs text-blue-600 font-medium hover:underline">Ver catálogo &rarr;</a>
          </div>

          <div class="space-y-3">
            @for (p of stockCritico(); track p.idProducto) {
              <div class="flex items-center justify-between p-3 rounded-lg border"
                   [class.border-rose-200]="p.stock === 0" [class.bg-rose-50]="p.stock === 0"
                   [class.border-amber-200]="p.stock > 0" [class.bg-amber-50]="p.stock > 0">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-slate-800 truncate">{{ p.nombreProducto }}</p>
                  <p class="text-[11px] text-slate-500 font-mono">{{ p.codigoProducto }} · {{ p.unidadMedida }}</p>
                </div>
                <span class="text-sm font-bold font-mono px-2.5 py-1 rounded-md"
                      [class.bg-rose-100]="p.stock === 0" [class.text-rose-700]="p.stock === 0"
                      [class.bg-amber-100]="p.stock > 0" [class.text-amber-700]="p.stock > 0">
                  {{ p.stock === 0 ? 'Agotado' : p.stock + ' u.' }}
                </span>
              </div>
            } @empty {
              <div class="text-center py-10">
                <p class="text-2xl">✅</p>
                <p class="text-sm text-slate-500 mt-1">Todo el inventario tiene stock suficiente.</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Tabla de comprobantes (AG Grid) -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-bold text-slate-800">Comprobantes</h3>
            <p class="text-xs text-slate-500">{{ filasTabla().length }} resultados · ordena y filtra desde las columnas</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <div class="relative">
              <input type="text" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)"
                     placeholder="Buscar en la tabla..."
                     class="w-56 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
              <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <select [ngModel]="estadoTabla()" (ngModelChange)="estadoTabla.set($event)"
                    class="border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-700">
              <option value="TODOS">Todos los estados</option>
              @for (e of estados; track e) {
                <option [value]="e">{{ e }}</option>
              }
            </select>
            <button (click)="exportarCsv()"
                    class="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition">
              Exportar CSV
            </button>
            <a routerLink="/facturas" class="text-xs text-blue-600 font-semibold hover:underline px-1">Ir a facturación &rarr;</a>
          </div>
        </div>

        <ag-grid-angular
          class="block w-full"
          style="height: 440px"
          [theme]="gridTheme"
          [rowData]="filasTabla()"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          [pagination]="true"
          [paginationPageSize]="8"
          [paginationPageSizeSelector]="[8, 15, 30]"
          [quickFilterText]="busqueda()"
          (gridReady)="onGridReady($event)" />
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private clienteService = inject(ClienteService);
  private productoService = inject(ProductoService);
  private facturaService = inject(FacturaService);
  private authService = inject(AuthService);

  // ---------- Datos ----------
  cargando = signal(false);
  clientes = signal<Cliente[]>([]);
  productos = signal<Producto[]>([]);
  facturas = signal<FacturaResponse[]>([]);

  usuario = this.authService.currentUser()?.nomusuario || 'Usuario';
  fechaHoy = new Date().toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // ---------- Filtros ----------
  estados = ESTADOS;
  rangos: { valor: Rango; etiqueta: string }[] = [
    { valor: '7', etiqueta: '7 días' },
    { valor: '30', etiqueta: '30 días' },
    { valor: '90', etiqueta: '90 días' },
    { valor: 'TODO', etiqueta: 'Todo' }
  ];
  rango = signal<Rango>('30');
  clienteFiltro = signal<number | null>(null);
  estadoTabla = signal<string>('TODOS');
  busqueda = signal<string>('');

  private diasRango = computed(() => (this.rango() === 'TODO' ? 0 : Number(this.rango())));

  private inicioRango = computed<Date | null>(() => {
    const d = this.diasRango();
    if (!d) return null;
    const h = new Date();
    return new Date(h.getFullYear(), h.getMonth(), h.getDate() - d + 1);
  });

  facturasF = computed(() => {
    const ini = this.inicioRango();
    const cli = this.clienteFiltro();
    return this.facturas().filter(f => {
      if (cli !== null && f.idCliente !== cli) return false;
      if (!ini) return true;
      const d = this.fechaDe(f);
      return !!d && d >= ini;
    });
  });

  // ---------- Métricas (misma lógica, sobre las facturas filtradas) ----------
  aceptadas = computed(() => this.facturasF().filter(f => f.estado === 'ACEPTADO'));

  ventasTotal = computed(() => this.aceptadas().reduce((s, f) => s + (Number(f.total) || 0), 0));

  igvTotal = computed(() =>
    this.aceptadas().reduce((s, f) => s + ((Number(f.total) || 0) - (Number(f.subtotal) || 0)), 0));

  ticketPromedio = computed(() =>
    this.aceptadas().length ? this.ventasTotal() / this.aceptadas().length : 0);

  tasaAceptacion = computed(() => {
    const ok = this.conteo('ACEPTADO');
    const resueltas = ok + this.conteo('RECHAZADO') + this.conteo('EXCEPCION');
    return resueltas ? (ok / resueltas) * 100 : 0;
  });

  variacionVentas = computed<number | null>(() => {
    const d = this.diasRango();
    const ini = this.inicioRango();
    if (!d || !ini) return null;
    const prevIni = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() - d);
    const cli = this.clienteFiltro();
    const prev = this.facturas()
      .filter(f => f.estado === 'ACEPTADO' && (cli === null || f.idCliente === cli))
      .filter(f => {
        const x = this.fechaDe(f);
        return !!x && x >= prevIni && x < ini;
      })
      .reduce((s, f) => s + (Number(f.total) || 0), 0);
    if (!prev) return null;
    return ((this.ventasTotal() - prev) / prev) * 100;
  });

  absVariacion = computed(() => Math.abs(this.variacionVentas() ?? 0));

  productosActivos = computed(() => this.productos().filter(p => p.activo).length);

  valorInventario = computed(() =>
    this.productos().filter(p => p.activo)
      .reduce((s, p) => s + (Number(p.precio) || 0) * (Number(p.stock) || 0), 0));

  stockCritico = computed(() =>
    this.productos()
      .filter(p => p.activo && (Number(p.stock) || 0) <= 10)
      .sort((a, b) => (a.stock || 0) - (b.stock || 0))
      .slice(0, 6));

  topClientes = computed(() => {
    const mapa = new Map<number, number>();
    for (const f of this.aceptadas()) {
      mapa.set(f.idCliente, (mapa.get(f.idCliente) || 0) + (Number(f.total) || 0));
    }
    return [...mapa.entries()]
      .map(([idCliente, total]) => ({ idCliente, total, nombre: this.nombreCliente(idCliente) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  });

  private diasGrafico = computed(() => this.diasRango() || 30);

  etiquetaGrafico = computed(() => `últimos ${this.diasGrafico()} días`);

  ventasDias = computed(() => {
    const n = this.diasGrafico();
    const hoy = new Date();
    const mapa = new Map<string, number>();
    for (const f of this.aceptadas()) {
      const k = String(f.fechaEmision).slice(0, 10);
      mapa.set(k, (mapa.get(k) || 0) + (Number(f.total) || 0));
    }
    const dias: { clave: string; etiqueta: string; total: number }[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
      const clave = this.ymd(d);
      dias.push({
        clave,
        etiqueta: d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }),
        total: mapa.get(clave) || 0
      });
    }
    return dias;
  });

  ventasGrafico = computed(() => this.ventasDias().reduce((s, d) => s + d.total, 0));

  // ---------- Gráficos (ApexCharts) ----------
  sinEtiquetas: ApexDataLabels = { enabled: false };
  etiquetasValor: ApexDataLabels = { enabled: true, style: { fontSize: '11px' } };
  sinLeyenda: ApexLegend = { show: false };
  leyendaAbajo: ApexLegend = { position: 'bottom', fontSize: '12px' };
  grillaSuave: ApexGrid = { borderColor: '#f1f5f9', strokeDashArray: 4 };

  tooltipSoles: ApexTooltip = {
    y: { formatter: (v: number) => this.soles(v) }
  };

  // Área: ventas
  chartArea: ApexChart = { type: 'area', height: 300, toolbar: { show: false }, fontFamily: 'inherit', zoom: { enabled: false } };
  strokeArea: ApexStroke = { curve: 'smooth', width: 3 };
  fillArea: ApexFill = { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 100] } };
  coloresArea = ['#2563eb'];
  yaxisSoles: ApexYAxis = {
    labels: {
      formatter: (v: number) => 'S/ ' + Math.round(v).toLocaleString('es-PE'),
      style: { colors: '#94a3b8', fontSize: '11px' }
    }
  };
  serieVentas = computed<ApexAxisChartSeries>(() => [{
    name: 'Ventas aceptadas',
    data: this.ventasDias().map(d => Math.round(d.total * 100) / 100)
  }]);
  xaxisVentas = computed<ApexXAxis>(() => ({
    categories: this.ventasDias().map(d => d.etiqueta),
    tickAmount: Math.min(this.ventasDias().length, 8),
    labels: { rotate: 0, style: { colors: '#64748b', fontSize: '11px' } },
    axisBorder: { show: false },
    axisTicks: { show: false }
  }));

  // Dona: estados
  chartDonut: ApexChart = { type: 'donut', height: 300, fontFamily: 'inherit' };
  strokeDonut: ApexStroke = { width: 2, colors: ['#ffffff'] };
  etiquetasDonut = ESTADOS;
  coloresDonut = ESTADOS.map(e => COLORES[e]);
  serieDonut = computed<number[]>(() => ESTADOS.map(e => this.conteo(e)));
  plotDonut = computed<ApexPlotOptions>(() => ({
    pie: {
      donut: {
        size: '72%',
        labels: {
          show: true,
          name: { show: true, fontSize: '12px', color: '#64748b' },
          value: { show: true, fontSize: '24px', fontWeight: 700, color: '#0f172a' },
          total: {
            show: true,
            showAlways: true,
            label: 'Facturas',
            color: '#64748b',
            formatter: () => String(this.facturasF().length)
          }
        }
      }
    }
  }));

  // Barras horizontales: top clientes
  chartBarra: ApexChart = { type: 'bar', height: 300, toolbar: { show: false }, fontFamily: 'inherit' };
  plotBarraH: ApexPlotOptions = { bar: { horizontal: true, borderRadius: 6, barHeight: '55%' } };
  yaxisTop: ApexYAxis = { labels: { maxWidth: 150, style: { colors: '#475569', fontSize: '12px' } } };
  serieTop = computed<ApexAxisChartSeries>(() => [{
    name: 'Facturado',
    data: this.topClientes().map(c => Math.round(c.total * 100) / 100)
  }]);
  xaxisTop = computed<ApexXAxis>(() => ({
    categories: this.topClientes().map(c => c.nombre),
    labels: {
      formatter: (v: string) => 'S/ ' + Number(v).toLocaleString('es-PE'),
      style: { colors: '#94a3b8', fontSize: '11px' }
    }
  }));

  // Columnas: stock
  plotStock: ApexPlotOptions = { bar: { distributed: true, borderRadius: 6, columnWidth: '50%' } };
  stockProductos = computed(() =>
    this.productos()
      .filter(p => p.activo)
      .sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0))
      .slice(0, 8));
  serieStock = computed<ApexAxisChartSeries>(() => [{
    name: 'Stock',
    data: this.stockProductos().map(p => Number(p.stock) || 0)
  }]);
  xaxisStock = computed<ApexXAxis>(() => ({
    categories: this.stockProductos().map(p => p.codigoProducto),
    labels: { rotate: -35, style: { colors: '#64748b', fontSize: '10px' } }
  }));
  coloresStock = computed<string[]>(() =>
    this.stockProductos().map(p => {
      const s = Number(p.stock) || 0;
      return s === 0 ? '#e11d48' : s <= 10 ? '#f59e0b' : '#10b981';
    }));

  // ---------- Tabla (AG Grid) ----------
  private gridApi?: GridApi<FacturaResponse>;

  gridTheme = themeQuartz.withParams({
    accentColor: '#2563eb',
    fontFamily: 'inherit',
    fontSize: 13,
    headerBackgroundColor: '#f8fafc',
    headerTextColor: '#64748b',
    headerFontWeight: 600,
    borderColor: '#f1f5f9',
    wrapperBorderRadius: 0
  });

  defaultColDef: ColDef<FacturaResponse> = { sortable: true, resizable: true, filter: true };

  columnDefs: ColDef<FacturaResponse>[] = [
    {
      headerName: 'Serie / Número',
      valueGetter: p => (p.data ? `${p.data.serie}-${p.data.numero}` : ''),
      flex: 1.1, minWidth: 140,
      cellStyle: { fontWeight: '700', fontFamily: 'ui-monospace, monospace' }
    },
    {
      headerName: 'Cliente',
      valueGetter: p => (p.data ? this.nombreCliente(p.data.idCliente) : ''),
      flex: 2, minWidth: 200
    },
    {
      headerName: 'Fecha',
      field: 'fechaEmision',
      valueFormatter: p => this.fechaCorta(p.value),
      flex: 1, minWidth: 120
    },
    {
      headerName: 'Subtotal',
      field: 'subtotal',
      type: 'rightAligned',
      valueFormatter: p => this.soles(p.value),
      flex: 1, minWidth: 120
    },
    {
      headerName: 'Total',
      field: 'total',
      type: 'rightAligned',
      valueFormatter: p => this.soles(p.value),
      cellStyle: { fontWeight: '700', color: '#059669' },
      flex: 1, minWidth: 120
    },
    {
      headerName: 'Estado',
      field: 'estado',
      flex: 1, minWidth: 130,
      cellRenderer: (p: ICellRendererParams<FacturaResponse>) => {
        const e = String(p.value || '');
        const c = COLORES[e] || '#64748b';
        return `<span style="background:${c}22;color:${c};padding:3px 10px;border-radius:9999px;font-size:11px;font-weight:600">${e}</span>`;
      }
    }
  ];

  filasTabla = computed(() => {
    const est = this.estadoTabla();
    return this.facturasF()
      .filter(f => est === 'TODOS' || f.estado === est)
      .sort((a, b) => (b.idFactura || 0) - (a.idFactura || 0));
  });

  onGridReady(e: GridReadyEvent<FacturaResponse>): void {
    this.gridApi = e.api;
  }

  exportarCsv(): void {
    this.gridApi?.exportDataAsCsv({ fileName: 'comprobantes.csv' });
  }

  // ---------- Carga (sin cambios) ----------
  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);

    forkJoin({
      clientes: this.clienteService.listarTodos().pipe(catchError(() => of([] as Cliente[]))),
      productos: this.productoService.listar().pipe(catchError(() => of([] as Producto[]))),
      facturas: forkJoin(
        ESTADOS.map(e =>
          this.facturaService.listarPorEstado(e).pipe(catchError(() => of([] as FacturaResponse[])))
        )
      )
    }).subscribe({
      next: ({ clientes, productos, facturas }) => {
        this.clientes.set(clientes || []);
        this.productos.set(productos || []);
        this.facturas.set(facturas.flat());
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  limpiarFiltros(): void {
    this.rango.set('30');
    this.clienteFiltro.set(null);
    this.estadoTabla.set('TODOS');
    this.busqueda.set('');
  }

  // ---------- Helpers ----------
  conteo(estado: string): number {
    return this.facturasF().filter(f => f.estado === estado).length;
  }

  nombreCliente(id: number): string {
    return this.clientes().find(c => c.idCliente === id)?.nombre || `Cliente ${id}`;
  }

  fechaCorta(fecha: any): string {
    const s = String(fecha || '').slice(0, 10);
    const [y, m, d] = s.split('-');
    return y && m && d ? `${d}/${m}/${y}` : s;
  }

  soles(v: any): string {
    return 'S/ ' + (Number(v) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private fechaDe(f: FacturaResponse): Date | null {
    const [y, m, d] = String(f.fechaEmision || '').slice(0, 10).split('-').map(Number);
    return y && m && d ? new Date(y, m - 1, d) : null;
  }

  private ymd(d: Date): string {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
}
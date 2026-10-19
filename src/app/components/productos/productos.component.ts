import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { AuthService } from '../../services/auth.service';
import { Producto, MovimientoStock } from '../../models/producto.model';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="text-xs font-semibold text-blue-600 uppercase tracking-wider">Inventario</p>
          <h2 class="text-2xl font-bold text-slate-800">Productos y Stock</h2>
          <p class="text-sm text-slate-500">Administración de gases industriales, precios y control de inventario.</p>
        </div>
        <button *ngIf="authService.isAdmin()" (click)="abrirModalCrear()"
                class="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
          + Nuevo producto
        </button>
      </div>

      <!-- Mensajes -->
      <div *ngIf="mensajeExito" class="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
        <span>✅</span><span>{{ mensajeExito }}</span>
      </div>
      <div *ngIf="mensajeError" class="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
        <span>⚠️</span><span>{{ mensajeError }}</span>
      </div>

      <!-- KPIs -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Productos</p>
          <p class="text-2xl font-extrabold text-slate-800 mt-2">{{ productos.length }}</p>
          <p class="text-[11px] text-slate-400 mt-1">{{ productosActivos }} activos</p>
        </div>
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor de inventario</p>
          <p class="text-2xl font-extrabold text-emerald-600 mt-2 font-mono">S/ {{ valorInventario | number:'1.2-2' }}</p>
          <p class="text-[11px] text-slate-400 mt-1">Precio × stock (activos)</p>
        </div>
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock bajo</p>
          <p class="text-2xl font-extrabold text-amber-600 mt-2">{{ stockBajo }}</p>
          <p class="text-[11px] text-slate-400 mt-1">10 unidades o menos</p>
        </div>
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agotados</p>
          <p class="text-2xl font-extrabold text-rose-600 mt-2">{{ agotados }}</p>
          <p class="text-[11px] text-slate-400 mt-1">Sin unidades disponibles</p>
        </div>
      </div>

      <!-- Tabla -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold text-slate-800">Inventario de gases</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              {{ productosFiltrados.length }} resultados
            </span>
          </div>
          <div class="flex items-center gap-2">
            <div class="relative w-full sm:w-72">
              <input type="text" [(ngModel)]="terminoBusqueda" (ngModelChange)="paginaActual = 1"
                     placeholder="Buscar por código o nombre..."
                     class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
              <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <button (click)="cargarProductos()" [disabled]="cargando"
                    class="text-xs px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition font-medium whitespace-nowrap disabled:opacity-50">
              {{ cargando ? 'Cargando...' : 'Actualizar' }}
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[840px] table-fixed text-left text-sm text-slate-600">
            <colgroup>
              <col />
              <col style="width: 100px" />
              <col style="width: 120px" />
              <col style="width: 150px" />
              <col style="width: 100px" />
              <col style="width: 150px" />
            </colgroup>
            <thead class="bg-slate-50 text-slate-500 text-[11px] uppercase font-semibold tracking-wider">
              <tr>
                <th class="px-4 py-3">Producto</th>
                <th class="px-4 py-3 text-center">Unidad</th>
                <th class="px-4 py-3 text-right">Precio</th>
                <th class="px-4 py-3 text-center">Stock</th>
                <th class="px-4 py-3 text-center">Estado</th>
                <th class="px-4 py-3 text-center whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let producto of productosPaginados" class="hover:bg-slate-50/70 transition">
                <td class="px-4 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">⛽</div>
                    <div class="min-w-0">
                      <p class="font-semibold text-slate-800 truncate">{{ producto.nombreProducto }}</p>
                      <p class="text-[11px] text-slate-400 font-mono">{{ producto.codigoProducto }}</p>
                      <p *ngIf="producto.descripcion" class="text-[11px] text-slate-400 truncate">{{ producto.descripcion }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                    {{ producto.unidadMedida }}
                  </span>
                </td>
                <td class="px-4 py-4 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                  S/ {{ producto.precio | number:'1.2-2' }}
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-mono font-bold text-sm" [ngClass]="textoStock(producto.stock)">{{ producto.stock }}</span>
                    <span class="text-[10px] font-semibold uppercase" [ngClass]="textoStock(producto.stock)">{{ etiquetaStock(producto.stock) }}</span>
                  </div>
                  <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500"
                         [ngClass]="barraStock(producto.stock)" [style.width.%]="porcentajeStock(producto.stock)"></div>
                  </div>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                        [ngClass]="producto.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                    {{ producto.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <button (click)="abrirModalMovimientos(producto)" title="Ver historial de movimientos" aria-label="Historial"
                            class="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </button>
                    <button *ngIf="authService.isAdmin()" (click)="abrirModalStock(producto)" title="Ajustar stock" aria-label="Ajustar stock"
                            class="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
                      </svg>
                    </button>
                    <button *ngIf="authService.isAdmin()" (click)="eliminarProducto(producto)" title="Eliminar producto" aria-label="Eliminar"
                            class="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="productosFiltrados.length === 0 && !cargando">
                <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                  {{ terminoBusqueda ? 'No se encontraron gases con el término "' + terminoBusqueda + '".' : 'No hay productos registrados en el inventario.' }}
                </td>
              </tr>
              <tr *ngIf="cargando">
                <td colspan="6" class="px-6 py-12 text-center text-slate-400">Cargando catálogo...</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div *ngIf="productosFiltrados.length > 0" class="p-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/60 text-xs text-slate-600">
          <div>
            Mostrando
            <span class="font-semibold text-slate-800">{{ (paginaActual - 1) * itemsPorPagina + 1 }}</span> a
            <span class="font-semibold text-slate-800">{{ mathMin(paginaActual * itemsPorPagina, productosFiltrados.length) }}</span> de
            <span class="font-semibold text-slate-800">{{ productosFiltrados.length }}</span> productos
          </div>
          <div class="flex items-center gap-1.5">
            <button (click)="cambiarPagina(paginaActual - 1)" [disabled]="paginaActual === 1"
                    class="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 font-medium transition">
              Anterior
            </button>
            <span class="px-2 font-semibold text-slate-700">{{ paginaActual }} / {{ totalPaginas }}</span>
            <button (click)="cambiarPagina(paginaActual + 1)" [disabled]="paginaActual === totalPaginas"
                    class="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 font-medium transition">
              Siguiente
            </button>
          </div>
        </div>
      </div>

      <!-- Modal crear -->
      <div *ngIf="mostrarModalCrear" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
          <div class="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-lg font-bold text-slate-800">Registrar producto de gas</h3>
              <p class="text-xs text-slate-500">Se enviará a SUNAT con su código de unidad.</p>
            </div>
            <button (click)="cerrarModalCrear()" class="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
          </div>

          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Código</label>
                <input [(ngModel)]="nuevoProducto.codigoProducto" placeholder="Ej: OX-IND-01"
                       class="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Unidad de medida</label>
                <select [(ngModel)]="nuevoProducto.unidadMedida" class="w-full border border-slate-300 rounded-lg p-2.5 text-sm">
                  <option value="BALON">BALON</option>
                  <option value="M3">M3</option>
                  <option value="LITRO">LITRO</option>
                  <option value="UNIDAD">UNIDAD</option>
                  <option value="KG">KG</option>
                  <option value="CAJA">CAJA</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Nombre del producto</label>
              <input [(ngModel)]="nuevoProducto.nombreProducto" placeholder="Ej: Oxígeno Industrial 6m3"
                     class="w-full border border-slate-300 rounded-lg p-2.5 text-sm" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Descripción</label>
              <input [(ngModel)]="nuevoProducto.descripcion" placeholder="Detalle o pureza del gas"
                     class="w-full border border-slate-300 rounded-lg p-2.5 text-sm" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Precio unitario sin IGV (S/)</label>
                <input type="number" [(ngModel)]="nuevoProducto.precio" placeholder="0.00"
                       class="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Stock inicial</label>
                <input type="number" [(ngModel)]="nuevoProducto.stock" placeholder="0"
                       class="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono" />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="cerrarModalCrear()" class="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button (click)="guardarProducto()" [disabled]="guardando"
                    class="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {{ guardando ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal ajustar stock -->
      <div *ngIf="mostrarModalStock && productoSeleccionado" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
          <div class="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 class="text-lg font-bold text-slate-800">Ajustar stock</h3>
            <button (click)="cerrarModalStock()" class="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
          </div>

          <div class="p-3 bg-slate-50 rounded-lg">
            <p class="text-sm font-semibold text-slate-800">{{ productoSeleccionado.nombreProducto }}</p>
            <p class="text-xs text-slate-500 font-mono">Stock actual: {{ productoSeleccionado.stock }} {{ productoSeleccionado.unidadMedida }}</p>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Operación</label>
              <select [(ngModel)]="tipoAjuste" class="w-full border border-slate-300 rounded-lg p-2.5 text-sm">
                <option value="INGRESAR">Ingresar stock (+)</option>
                <option value="DESCONTAR">Descontar stock (-)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Cantidad</label>
              <input type="number" [(ngModel)]="cantidadAjuste" min="1"
                     class="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Motivo / referencia</label>
              <input [(ngModel)]="referenciaAjuste" placeholder="Ej: Compra proveedor / Merma"
                     class="w-full border border-slate-300 rounded-lg p-2.5 text-sm" />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="cerrarModalStock()" class="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button (click)="guardarAjusteStock()" [disabled]="guardando"
                    class="px-5 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 disabled:opacity-50">
              {{ guardando ? 'Aplicando...' : 'Aplicar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal historial -->
      <div *ngIf="mostrarModalMovimientos" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
          <div class="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-base font-bold text-slate-800">Historial de movimientos de stock</h3>
              <p class="text-xs text-slate-500 font-mono mt-0.5" *ngIf="productoSeleccionado">
                {{ productoSeleccionado.codigoProducto }} — {{ productoSeleccionado.nombreProducto }}
              </p>
            </div>
            <button (click)="cerrarModalMovimientos()" class="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
          </div>

          <div *ngIf="cargandoMovimientos" class="py-8 text-center text-slate-500 text-xs">
            Cargando historial de movimientos...
          </div>

          <div *ngIf="!cargandoMovimientos" class="overflow-x-auto max-h-80 overflow-y-auto rounded-lg border border-slate-100">
            <table class="w-full text-left text-xs text-slate-600">
              <thead class="bg-slate-50 text-slate-500 uppercase font-semibold sticky top-0">
                <tr>
                  <th class="px-3 py-2">Fecha</th>
                  <th class="px-3 py-2">Tipo</th>
                  <th class="px-3 py-2">Cantidad</th>
                  <th class="px-3 py-2">Stock ant.</th>
                  <th class="px-3 py-2">Stock nvo.</th>
                  <th class="px-3 py-2">Referencia</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let m of movimientos" class="hover:bg-slate-50">
                  <td class="px-3 py-2 font-mono text-slate-700">{{ m.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="px-3 py-2">
                    <span class="px-2 py-0.5 rounded text-[11px] font-semibold"
                          [ngClass]="m.tipo === 'INGRESAR' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
                      {{ m.tipo }}
                    </span>
                  </td>
                  <td class="px-3 py-2 font-bold font-mono">{{ m.cantidad }}</td>
                  <td class="px-3 py-2 font-mono text-slate-500">{{ m.stockAnterior }}</td>
                  <td class="px-3 py-2 font-mono font-bold text-slate-800">{{ m.stockNuevo }}</td>
                  <td class="px-3 py-2 text-slate-600">{{ m.referencia || '-' }}</td>
                </tr>
                <tr *ngIf="movimientos.length === 0">
                  <td colspan="6" class="px-3 py-8 text-center text-slate-400">
                    No se han registrado movimientos de stock para este producto.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-end pt-3 border-t border-slate-100">
            <button (click)="cerrarModalMovimientos()" class="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProductosComponent implements OnInit {
  private productoService = inject(ProductoService);
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  productos: Producto[] = [];
  cargando = false;
  guardando = false;
  mensajeExito = '';
  mensajeError = '';
  terminoBusqueda = '';

  get productosFiltrados(): Producto[] {
    const q = this.terminoBusqueda.trim().toLowerCase();
    if (!q) return this.productos;
    return this.productos.filter(p =>
      (p.codigoProducto && p.codigoProducto.toLowerCase().includes(q)) ||
      (p.nombreProducto && p.nombreProducto.toLowerCase().includes(q)) ||
      (p.unidadMedida && p.unidadMedida.toLowerCase().includes(q)) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(q))
    );
  }

  // Métricas
  get productosActivos(): number {
    return this.productos.filter(p => p.activo).length;
  }

  get valorInventario(): number {
    return this.productos
      .filter(p => p.activo)
      .reduce((s, p) => s + (Number(p.precio) || 0) * (Number(p.stock) || 0), 0);
  }

  get stockBajo(): number {
    return this.productos.filter(p => p.activo && Number(p.stock) > 0 && Number(p.stock) <= 10).length;
  }

  get agotados(): number {
    return this.productos.filter(p => p.activo && (Number(p.stock) || 0) === 0).length;
  }

  get stockMaximo(): number {
    return Math.max(...this.productos.map(p => Number(p.stock) || 0), 10);
  }

  porcentajeStock(stock: number): number {
    return Math.min(100, ((Number(stock) || 0) / this.stockMaximo) * 100);
  }

  etiquetaStock(stock: number): string {
    const s = Number(stock) || 0;
    if (s === 0) return 'Agotado';
    if (s <= 10) return 'Bajo';
    return 'Normal';
  }

  textoStock(stock: number): string {
    const s = Number(stock) || 0;
    if (s === 0) return 'text-rose-600';
    if (s <= 10) return 'text-amber-600';
    return 'text-slate-800';
  }

  barraStock(stock: number): string {
    const s = Number(stock) || 0;
    if (s === 0) return 'bg-rose-500';
    if (s <= 10) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  mostrarModalCrear = false;
  mostrarModalStock = false;
  mostrarModalMovimientos = false;
  cargandoMovimientos = false;
  productoSeleccionado: Producto | null = null;
  movimientos: MovimientoStock[] = [];

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 5;

  get totalPaginas(): number {
    return Math.ceil(this.productosFiltrados.length / this.itemsPorPagina) || 1;
  }

  get productosPaginados(): Producto[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.productosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.cdr.markForCheck();
    }
  }

  mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  tipoAjuste: 'INGRESAR' | 'DESCONTAR' = 'INGRESAR';
  cantidadAjuste = 1;
  referenciaAjuste = '';

  nuevoProducto: Producto = {
    codigoProducto: '',
    nombreProducto: '',
    descripcion: '',
    unidadMedida: 'BALON',
    precio: 0,
    stock: 0,
    activo: true
  };

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.cargando = true;
    this.cdr.markForCheck();
    this.productoService.listar().subscribe({
      next: (data) => {
        this.productos = data || [];
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  abrirModalCrear(): void {
    this.mostrarModalCrear = true;
    this.mensajeExito = '';
    this.mensajeError = '';
    this.nuevoProducto = {
      codigoProducto: '',
      nombreProducto: '',
      descripcion: '',
      unidadMedida: 'BALON',
      precio: 0,
      stock: 0,
      activo: true
    };
  }

  cerrarModalCrear(): void {
    this.mostrarModalCrear = false;
  }

  guardarProducto(): void {
    if (!this.nuevoProducto.codigoProducto || !this.nuevoProducto.nombreProducto || this.nuevoProducto.precio <= 0) {
      this.mensajeError = 'Complete el código, nombre y un precio mayor a 0.';
      return;
    }

    this.guardando = true;
    this.mensajeExito = '';
    this.mensajeError = '';

    this.productoService.registrar(this.nuevoProducto).subscribe({
      next: () => {
        this.mensajeExito = 'Producto registrado exitosamente en el inventario.';
        this.guardando = false;
        this.cerrarModalCrear();
        this.cargarProductos();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.mensajeError = err.error?.message || 'Error al registrar el producto.';
        this.guardando = false;
        this.cdr.markForCheck();
      }
    });
  }

  abrirModalStock(producto: Producto): void {
    this.productoSeleccionado = producto;
    this.tipoAjuste = 'INGRESAR';
    this.cantidadAjuste = 1;
    this.referenciaAjuste = '';
    this.mostrarModalStock = true;
    this.mensajeExito = '';
    this.mensajeError = '';
    this.cdr.markForCheck();
  }

  cerrarModalStock(): void {
    this.mostrarModalStock = false;
    this.productoSeleccionado = null;
    this.cdr.markForCheck();
  }

  guardarAjusteStock(): void {
    if (!this.productoSeleccionado?.idProducto || this.cantidadAjuste <= 0) {
      this.mensajeError = 'Indique una cantidad válida.';
      return;
    }

    this.guardando = true;
    this.cdr.markForCheck();
    const id = this.productoSeleccionado.idProducto;
    const obs = this.tipoAjuste === 'INGRESAR'
      ? this.productoService.ingresarStock(id, this.cantidadAjuste, this.referenciaAjuste)
      : this.productoService.descontarStock(id, this.cantidadAjuste, this.referenciaAjuste);

    obs.subscribe({
      next: () => {
        this.mensajeExito = `Stock actualizado correctamente (${this.tipoAjuste}).`;
        this.guardando = false;
        this.cerrarModalStock();
        this.cargarProductos();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.mensajeError = err.error?.message || 'Error al actualizar stock.';
        this.guardando = false;
        this.cdr.markForCheck();
      }
    });
  }

  eliminarProducto(producto: Producto): void {
    if (!producto.idProducto) return;
    if (!confirm(`¿Desea eliminar el producto ${producto.nombreProducto}?`)) return;

    this.productoService.eliminar(producto.idProducto).subscribe({
      next: () => {
        this.mensajeExito = 'Producto eliminado del catálogo.';
        this.cargarProductos();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.mensajeError = err.error?.message || 'Error al eliminar el producto.';
        this.cdr.markForCheck();
      }
    });
  }

  abrirModalMovimientos(producto: Producto): void {
    this.productoSeleccionado = producto;
    this.mostrarModalMovimientos = true;
    this.cargandoMovimientos = true;
    this.movimientos = [];
    this.cdr.markForCheck();

    if (producto.idProducto) {
      this.productoService.obtenerMovimientos(producto.idProducto).subscribe({
        next: (data) => {
          this.movimientos = data || [];
          this.cargandoMovimientos = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargandoMovimientos = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.cargandoMovimientos = false;
      this.cdr.markForCheck();
    }
  }

  cerrarModalMovimientos(): void {
    this.mostrarModalMovimientos = false;
    this.productoSeleccionado = null;
    this.movimientos = [];
    this.cdr.markForCheck();
  }
}
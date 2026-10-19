import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaService } from '../../services/factura.service';
import { ClienteService } from '../../services/cliente.service';
import { ProductoService } from '../../services/producto.service';
import { Cliente } from '../../models/cliente.model';
import { Producto } from '../../models/producto.model';
import { FacturaRequest, ItemFactura, FacturaResponse } from '../../models/factura.model';

@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Encabezado -->
      <div>
        <p class="text-xs font-semibold text-blue-600 uppercase tracking-wider">Facturación electrónica</p>
        <h2 class="text-2xl font-bold text-slate-800">Emisión y Gestión de Facturas</h2>
        <p class="text-sm text-slate-500">Comprobantes electrónicos, encolado asíncrono y despacho a SUNAT.</p>
      </div>

      <!-- Pestañas -->
      <div class="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm text-sm">
        <button (click)="cambiarTab('INDIVIDUAL')"
                [ngClass]="tabActiva === 'INDIVIDUAL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'"
                class="px-4 py-2 rounded-lg font-medium transition">
          Emisión individual
        </button>
        <button (click)="cambiarTab('LOTE')"
                [ngClass]="tabActiva === 'LOTE' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'"
                class="px-4 py-2 rounded-lg font-medium transition">
          Emisión en lote
        </button>
        <button (click)="cambiarTab('HISTORIAL')"
                [ngClass]="tabActiva === 'HISTORIAL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'"
                class="px-4 py-2 rounded-lg font-medium transition">
          Historial
        </button>
      </div>

      <!-- Mensajes -->
      <div *ngIf="mensajeExito" class="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
        <span>✅</span><span>{{ mensajeExito }}</span>
      </div>
      <div *ngIf="mensajeError" class="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
        <span>⚠️</span><span>{{ mensajeError }}</span>
      </div>

      <!-- ===================== EMISIÓN INDIVIDUAL ===================== -->
      <div *ngIf="tabActiva === 'INDIVIDUAL'" class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span class="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
              <h3 class="text-base font-bold text-slate-800">Comprobante y cliente</h3>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Serie</label>
                <input [(ngModel)]="serie" class="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono font-bold" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-700 mb-1">Cliente receptor</label>
                <select [(ngModel)]="idClienteSeleccionado" class="w-full border border-slate-300 rounded-lg p-2.5 text-sm">
                  <option [ngValue]="null">-- Seleccione un cliente --</option>
                  <option *ngFor="let c of clientes" [ngValue]="c.idCliente">
                    {{ c.tipoDocumento }}: {{ c.numeroDocumento }} - {{ c.nombre }}
                  </option>
                </select>
              </div>
            </div>

            <div *ngIf="clienteSeleccionado as cli" class="p-3 rounded-lg border text-xs flex items-start gap-3"
                 [ngClass]="esRuc(cli) ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-amber-50 border-amber-200 text-amber-800'">
              <span class="text-base">{{ esRuc(cli) ? '🏢' : '⚠️' }}</span>
              <div>
                <p class="font-semibold">{{ cli.nombre }}</p>
                <p class="font-mono">{{ cli.tipoDocumento }} {{ cli.numeroDocumento }}</p>
                <p *ngIf="cli.direccion">{{ cli.direccion }}</p>
                <p *ngIf="!esRuc(cli)" class="mt-1 font-semibold">Una factura requiere un cliente con RUC. Este comprobante será descartado.</p>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span class="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
              <h3 class="text-base font-bold text-slate-800">Productos de gas</h3>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-700 mb-1">Producto</label>
                <select [(ngModel)]="idProductoSeleccionado" class="w-full border border-slate-300 rounded-lg p-2.5 text-sm">
                  <option [ngValue]="null">-- Seleccione gas --</option>
                  <option *ngFor="let p of productos" [ngValue]="p.idProducto">
                    {{ p.codigoProducto }} - {{ p.nombreProducto }} (S/ {{ p.precio }} | Stock: {{ p.stock }})
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Cantidad</label>
                <input type="number" [(ngModel)]="cantidadAgregar" min="1"
                       class="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono" />
              </div>
              <div>
                <button (click)="agregarItem()"
                        class="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition">
                  + Agregar
                </button>
              </div>
            </div>

            <div class="overflow-x-auto border border-slate-100 rounded-lg">
              <table class="w-full text-left text-xs text-slate-600">
                <thead class="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th class="px-4 py-2.5">Código</th>
                    <th class="px-4 py-2.5">Descripción</th>
                    <th class="px-4 py-2.5 text-center">Cant.</th>
                    <th class="px-4 py-2.5 text-right">P. Unit</th>
                    <th class="px-4 py-2.5 text-right">Subtotal</th>
                    <th class="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let it of items; let idx = index" class="hover:bg-slate-50">
                    <td class="px-4 py-2.5 font-mono">{{ it.codigoProducto }}</td>
                    <td class="px-4 py-2.5 font-medium text-slate-800">{{ it.nombreProducto }}</td>
                    <td class="px-4 py-2.5 text-center font-bold font-mono">{{ it.cantidad }}</td>
                    <td class="px-4 py-2.5 text-right font-mono">S/ {{ it.precioUnitario | number:'1.2-2' }}</td>
                    <td class="px-4 py-2.5 text-right font-mono font-semibold text-slate-900">S/ {{ it.subtotal | number:'1.2-2' }}</td>
                    <td class="px-4 py-2.5 text-center">
                      <button (click)="removerItem(idx)" class="text-rose-400 hover:text-rose-600 text-lg leading-none">&times;</button>
                    </td>
                  </tr>
                  <tr *ngIf="items.length === 0">
                    <td colspan="6" class="px-4 py-8 text-center text-slate-400">No se han agregado gases al comprobante.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Resumen -->
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 lg:sticky lg:top-4">
          <h3 class="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">Resumen de factura</h3>

          <div class="space-y-2 text-sm text-slate-600">
            <div class="flex justify-between">
              <span>Ítems</span>
              <span class="font-mono font-medium">{{ items.length }}</span>
            </div>
            <div class="flex justify-between">
              <span>Subtotal (op. gravada)</span>
              <span class="font-mono font-medium">S/ {{ totalBase | number:'1.2-2' }}</span>
            </div>
            <div class="flex justify-between">
              <span>I.G.V. (18%)</span>
              <span class="font-mono font-medium">S/ {{ totalIgv | number:'1.2-2' }}</span>
            </div>
            <div class="flex justify-between text-base font-bold text-slate-900 pt-3 border-t border-slate-100">
              <span>Total a pagar</span>
              <span class="font-mono text-emerald-600">S/ {{ totalPagar | number:'1.2-2' }}</span>
            </div>
          </div>

          <button (click)="emitirFactura()"
                  [disabled]="emitiendo || items.length === 0 || !idClienteSeleccionado || (clienteSeleccionado && !esRuc(clienteSeleccionado))"
                  class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm transition shadow-sm disabled:opacity-50">
            {{ emitiendo ? 'Emitiendo comprobante...' : 'Emitir factura electrónica' }}
          </button>

          <p class="text-[11px] text-slate-400 text-center">
            El comprobante se procesa en segundo plano conforme a la normativa SUNAT.
          </p>
        </div>
      </div>

      <!-- ===================== EMISIÓN EN LOTE ===================== -->
      <div *ngIf="tabActiva === 'LOTE'" class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 max-w-3xl">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-lg">📨</div>
          <div>
            <h3 class="text-base font-bold text-slate-800">Emisión masiva por lote</h3>
            <p class="text-xs text-slate-500">Procesamiento asíncrono con encolamiento en RabbitMQ, una factura tras otra.</p>
          </div>
        </div>

        <div class="space-y-4 text-sm">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Cliente receptor</label>
              <select [(ngModel)]="idClienteLote" class="w-full border border-slate-300 rounded-lg p-2.5 text-sm">
                <option [ngValue]="null">-- Seleccione cliente --</option>
                <option *ngFor="let c of clientes" [ngValue]="c.idCliente">
                  {{ c.tipoDocumento }}: {{ c.nombre }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Producto de gas</label>
              <select [(ngModel)]="idProductoLote" class="w-full border border-slate-300 rounded-lg p-2.5 text-sm">
                <option [ngValue]="null">-- Seleccione gas --</option>
                <option *ngFor="let p of productos" [ngValue]="p.idProducto">
                  {{ p.nombreProducto }} (S/ {{ p.precio }})
                </option>
              </select>
            </div>
          </div>

          <div *ngIf="clienteLote && !esRuc(clienteLote)" class="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold">
            ⚠️ Este cliente no tiene RUC: todas las facturas del lote serán descartadas.
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Serie</label>
              <input [(ngModel)]="serieLote" class="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono font-bold" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Cant. por factura</label>
              <input type="number" [(ngModel)]="cantidadPorFacturaLote" min="1" class="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Total de facturas</label>
              <select [(ngModel)]="totalFacturasLote" class="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-semibold">
                <option [ngValue]="5">5 facturas</option>
                <option [ngValue]="10">10 facturas</option>
                <option [ngValue]="20">20 facturas</option>
                <option [ngValue]="50">50 facturas (estrés)</option>
              </select>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            Se generará un lote de <strong>{{ totalFacturasLote }} comprobantes</strong> y se enviará en una sola petición a
            <strong>POST /api/facturas/lote</strong> para que RabbitMQ los procese en orden.
          </div>

          <button (click)="emitirLote()" [disabled]="emitiendoLote || !idClienteLote || !idProductoLote"
                  class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50">
            {{ emitiendoLote ? 'Encolando lote...' : 'Generar y encolar lote' }}
          </button>
        </div>
      </div>

      <!-- ===================== HISTORIAL ===================== -->
      <div *ngIf="tabActiva === 'HISTORIAL'" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100">
          <div>
            <h3 class="text-base font-bold text-slate-800">Historial de comprobantes</h3>
            <p class="text-xs text-slate-500">Consulta por cliente o por estado, anulación y reenvío de correo.</p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <select [(ngModel)]="filtroTipoHistorial" (change)="cargarHistorial()" class="border border-slate-300 rounded-lg p-2 text-xs">
              <option value="CLIENTE">Por cliente</option>
              <option value="ESTADO">Por estado</option>
            </select>

            <select *ngIf="filtroTipoHistorial === 'CLIENTE'" [(ngModel)]="idClienteFiltro" (change)="cargarHistorial()" class="border border-slate-300 rounded-lg p-2 text-xs max-w-xs">
              <option [ngValue]="null">-- Seleccione cliente --</option>
              <option *ngFor="let c of clientes" [ngValue]="c.idCliente">{{ c.nombre }}</option>
            </select>

            <select *ngIf="filtroTipoHistorial === 'ESTADO'" [(ngModel)]="estadoFiltro" (change)="cargarHistorial()" class="border border-slate-300 rounded-lg p-2 text-xs">
              <option *ngFor="let e of estadosFactura" [value]="e">{{ e }}</option>
            </select>

            <button (click)="cargarHistorial()" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
              Consultar
            </button>
          </div>
        </div>

        <!-- Totales del filtro -->
        <div *ngIf="!cargandoHistorial && facturasHistorial.length > 0" class="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/60">
          <div class="px-5 py-3">
            <p class="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Comprobantes</p>
            <p class="text-lg font-bold text-slate-800">{{ facturasHistorial.length }}</p>
          </div>
          <div class="px-5 py-3">
            <p class="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Suma total</p>
            <p class="text-lg font-bold text-emerald-600 font-mono">S/ {{ sumaHistorial | number:'1.2-2' }}</p>
          </div>
          <div class="px-5 py-3">
            <p class="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Aceptados</p>
            <p class="text-lg font-bold text-slate-800">{{ aceptadosHistorial }}</p>
          </div>
        </div>

        <div *ngIf="cargandoHistorial" class="py-12 text-center text-slate-400 text-xs">Consultando comprobantes...</div>

        <div *ngIf="!cargandoHistorial" class="overflow-x-auto">
          <table class="w-full min-w-[860px] table-fixed text-left text-xs text-slate-600">
            <colgroup>
              <col style="width: 60px" />
              <col style="width: 130px" />
              <col style="width: 120px" />
              <col style="width: 130px" />
              <col style="width: 130px" />
              <col style="width: 120px" />
              <col style="width: 170px" />
            </colgroup>
            <thead class="bg-slate-50 text-slate-500 uppercase font-semibold tracking-wider">
              <tr>
                <th class="px-5 py-3">ID</th>
                <th class="px-5 py-3">Serie / Número</th>
                <th class="px-5 py-3 text-center">Fecha emisión</th>
                <th class="px-5 py-3 text-right">Subtotal</th>
                <th class="px-5 py-3 text-right">Total</th>
                <th class="px-5 py-3 text-center">Estado</th>
                <th class="px-5 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let f of facturasHistorial" class="hover:bg-slate-50/70">
                <td class="px-5 py-3 font-mono text-slate-400">{{ f.idFactura }}</td>
                <td class="px-5 py-3 font-mono font-bold text-slate-800">{{ f.serie }}-{{ f.numero || f.idFactura }}</td>
                <td class="px-5 py-3 font-mono text-center">{{ f.fechaEmision | date:'dd/MM/yyyy' }}</td>
                <td class="px-5 py-3 text-right font-mono whitespace-nowrap">S/ {{ f.subtotal | number:'1.2-2' }}</td>
                <td class="px-5 py-3 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">S/ {{ f.total | number:'1.2-2' }}</td>
                <td class="px-5 py-3 text-center">
                  <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold" [ngClass]="claseEstado(f.estado)">
                    {{ f.estado }}
                  </span>
                </td>
                <td class="px-5 py-3">
                  <div class="flex items-center justify-center gap-2">
                    <button (click)="descargarPdf(f)" [disabled]="descargandoId === f.idFactura"
                            title="Descargar PDF" aria-label="Descargar PDF"
                            class="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition disabled:opacity-50">
                      <svg *ngIf="descargandoId !== f.idFactura" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"/>
                      </svg>
                      <svg *ngIf="descargandoId === f.idFactura" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                    </button>
                    <button (click)="abrirModalEnvio(f)" title="Enviar por correo" aria-label="Enviar por correo"
                            class="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </button>
                    <span class="w-9 h-9 inline-flex">
                      <button *ngIf="f.estado === 'ACEPTADO'" (click)="abrirModalAnular(f)" title="Anular factura" aria-label="Anular factura"
                              class="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-12.728 12.728M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </button>
                    </span>
                  </div>
                </td>
              </tr>
              <tr *ngIf="facturasHistorial.length === 0">
                <td colspan="7" class="px-5 py-12 text-center text-slate-400">
                  No se encontraron comprobantes para el filtro seleccionado.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal enviar correo -->
      <div *ngIf="mostrarModalEnvio" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
          <div class="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 class="text-base font-bold text-slate-800">Enviar factura por correo</h3>
            <button (click)="cerrarModalEnvio()" class="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
          </div>

          <div class="space-y-3">
            <p class="text-xs text-slate-500">
              Se despachará la factura <strong>#{{ facturaSeleccionada?.idFactura }}</strong> al correo indicado mediante el microservicio <strong>Ms-envio</strong>.
            </p>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Correo electrónico</label>
              <input type="email" [(ngModel)]="correoDestino" placeholder="cliente@empresa.com"
                     class="w-full border border-slate-300 rounded-lg p-2.5 text-sm" />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="cerrarModalEnvio()" class="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button (click)="enviarCorreoFactura()" [disabled]="enviandoCorreo || !correoDestino"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
              {{ enviandoCorreo ? 'Despachando...' : 'Despachar correo' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal anular -->
      <div *ngIf="mostrarModalAnular" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
          <div class="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 class="text-base font-bold text-slate-800">Anular factura</h3>
            <button (click)="cerrarModalAnular()" class="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
          </div>

          <div class="space-y-3">
            <p class="text-xs text-slate-500">
              Se enviará la baja de la factura
              <strong>{{ facturaAnular?.serie }}-{{ facturaAnular?.numero }}</strong> a SUNAT.
              <span class="text-rose-600 font-semibold">Esta acción es irreversible.</span>
            </p>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Motivo (3 a 100 caracteres)</label>
              <input type="text" [(ngModel)]="motivoAnulacion" maxlength="100" placeholder="Ej: Error en la emisión"
                     class="w-full border border-slate-300 rounded-lg p-2.5 text-sm" />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="cerrarModalAnular()" class="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button (click)="anularFactura()" [disabled]="anulando || motivoAnulacion.trim().length < 3"
                    class="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 disabled:opacity-50">
              {{ anulando ? 'Anulando...' : 'Confirmar anulación' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class FacturasComponent implements OnInit {
  private facturaService = inject(FacturaService);
  private clienteService = inject(ClienteService);
  private productoService = inject(ProductoService);
  private cdr = inject(ChangeDetectorRef);

  tabActiva: 'INDIVIDUAL' | 'LOTE' | 'HISTORIAL' = 'INDIVIDUAL';

  clientes: Cliente[] = [];
  productos: Producto[] = [];

  serie = 'F001';
  idClienteSeleccionado: number | null = null;
  idProductoSeleccionado: number | null = null;
  cantidadAgregar = 1;

  items: ItemFactura[] = [];

  emitiendo = false;
  mensajeExito = '';
  mensajeError = '';

  // Emisión por lote (RabbitMQ)
  idClienteLote: number | null = null;
  idProductoLote: number | null = null;
  serieLote = 'F001';
  cantidadPorFacturaLote = 2;
  totalFacturasLote = 10;
  emitiendoLote = false;

  // Historial de facturas
  facturasHistorial: FacturaResponse[] = [];
  cargandoHistorial = false;
  filtroTipoHistorial: 'CLIENTE' | 'ESTADO' = 'CLIENTE';
  idClienteFiltro: number | null = null;
  estadosFactura = ['PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'EXCEPCION', 'ANULADO'];
  estadoFiltro = 'ACEPTADO';

  // Modal enviar correo (Ms-envio)
  mostrarModalEnvio = false;
  facturaSeleccionada: FacturaResponse | null = null;
  correoDestino = '';
  enviandoCorreo = false;

  // Modal anular
  mostrarModalAnular = false;
  facturaAnular: FacturaResponse | null = null;
  motivoAnulacion = '';
  anulando = false;

  get totalPagar(): number {
    return this.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }

  get totalBase(): number {
    return this.totalPagar / 1.18;
  }

  get totalIgv(): number {
    return this.totalPagar - this.totalBase;
  }

  get clienteSeleccionado(): Cliente | null {
    return this.clientes.find(c => c.idCliente === this.idClienteSeleccionado) || null;
  }

  get clienteLote(): Cliente | null {
    return this.clientes.find(c => c.idCliente === this.idClienteLote) || null;
  }

  get sumaHistorial(): number {
    return this.facturasHistorial.reduce((s, f) => s + (Number(f.total) || 0), 0);
  }

  get aceptadosHistorial(): number {
    return this.facturasHistorial.filter(f => f.estado === 'ACEPTADO').length;
  }

  esRuc(c: Cliente | null): boolean {
    return !!c && c.tipoDocumento === 'RUC';
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'ACEPTADO': return 'bg-emerald-100 text-emerald-700';
      case 'PENDIENTE': return 'bg-amber-100 text-amber-700';
      case 'RECHAZADO':
      case 'EXCEPCION': return 'bg-rose-100 text-rose-700';
      case 'ANULADO': return 'bg-slate-200 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  cambiarTab(tab: 'INDIVIDUAL' | 'LOTE' | 'HISTORIAL'): void {
    this.tabActiva = tab;
    this.mensajeExito = '';
    this.mensajeError = '';
    if (tab === 'HISTORIAL') {
      this.cargarHistorial();
    }
    this.cdr.markForCheck();
  }

  cargarDatos(): void {
    this.clienteService.listarTodos().subscribe({
      next: (data) => {
        this.clientes = data || [];
        if (this.clientes.length > 0 && !this.idClienteLote) {
          const porDefecto = this.clientes.find(c => c.tipoDocumento === 'RUC') || this.clientes[0];
          this.idClienteLote = porDefecto.idCliente || null;
          this.idClienteFiltro = porDefecto.idCliente || null;
        }
        this.cdr.markForCheck();
      }
    });

    this.productoService.listar().subscribe({
      next: (data) => {
        this.productos = (data || []).filter(p => p.activo);
        if (this.productos.length > 0 && !this.idProductoLote) {
          this.idProductoLote = this.productos[0].idProducto || null;
        }
        this.cdr.markForCheck();
      }
    });
  }

  agregarItem(): void {
    if (!this.idProductoSeleccionado || this.cantidadAgregar <= 0) {
      this.mensajeError = 'Seleccione un producto y una cantidad válida.';
      this.cdr.markForCheck();
      return;
    }

    const prod = this.productos.find(p => p.idProducto === this.idProductoSeleccionado);
    if (!prod) return;

    if (this.cantidadAgregar > prod.stock) {
      this.mensajeError = `Stock insuficiente. Disponible: ${prod.stock} ${prod.unidadMedida}`;
      this.cdr.markForCheck();
      return;
    }

    const subtotal = prod.precio * this.cantidadAgregar;

    this.items.push({
      idProducto: prod.idProducto!,
      cantidad: this.cantidadAgregar,
      codigoProducto: prod.codigoProducto,
      nombreProducto: prod.nombreProducto,
      precioUnitario: prod.precio,
      subtotal: subtotal
    });

    this.idProductoSeleccionado = null;
    this.cantidadAgregar = 1;
    this.mensajeError = '';
    this.cdr.markForCheck();
  }

  removerItem(index: number): void {
    this.items.splice(index, 1);
    this.cdr.markForCheck();
  }

  emitirFactura(): void {
    if (!this.idClienteSeleccionado) {
      this.mensajeError = 'Debe seleccionar un cliente.';
      this.cdr.markForCheck();
      return;
    }

    if (this.items.length === 0) {
      this.mensajeError = 'Debe agregar al menos un producto a la factura.';
      this.cdr.markForCheck();
      return;
    }

    this.emitiendo = true;
    this.mensajeExito = '';
    this.mensajeError = '';
    this.cdr.markForCheck();

    const payload: FacturaRequest = {
      idCliente: this.idClienteSeleccionado,
      serie: this.serie,
      items: this.items.map(item => ({
        idProducto: item.idProducto,
        cantidad: item.cantidad
      }))
    };

    this.facturaService.emitir(payload).subscribe({
      next: (res) => {
        this.mensajeExito = `Factura emitida exitosamente. Mensaje: ${res.mensaje || 'En proceso'}`;
        this.emitiendo = false;
        this.items = [];
        this.idClienteSeleccionado = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.mensajeError = err.error?.message || 'No se pudo conectar con el microservicio de facturación (puerto 8099).';
        this.emitiendo = false;
        this.cdr.markForCheck();
      }
    });
  }

  emitirLote(): void {
    if (!this.idClienteLote || !this.idProductoLote) {
      this.mensajeError = 'Seleccione un cliente y un producto para el lote.';
      this.cdr.markForCheck();
      return;
    }

    this.emitiendoLote = true;
    this.mensajeExito = '';
    this.mensajeError = '';
    this.cdr.markForCheck();

    const loteRequests: FacturaRequest[] = [];
    for (let i = 0; i < this.totalFacturasLote; i++) {
      loteRequests.push({
        idCliente: this.idClienteLote,
        serie: this.serieLote,
        items: [{
          idProducto: this.idProductoLote,
          cantidad: this.cantidadPorFacturaLote
        }]
      });
    }

    this.facturaService.emitirLote(loteRequests).subscribe({
      next: (res) => {
        this.mensajeExito = `Lote de ${res.encolados || this.totalFacturasLote} facturas encolado exitosamente en RabbitMQ. ${res.mensaje || ''}`;
        this.emitiendoLote = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.mensajeError = err.error?.message || 'No se pudo enviar el lote al microservicio de facturación (puerto 8099).';
        this.emitiendoLote = false;
        this.cdr.markForCheck();
      }
    });
  }

  cargarHistorial(): void {
    this.cargandoHistorial = true;
    this.facturasHistorial = [];
    this.cdr.markForCheck();

    const obs = this.filtroTipoHistorial === 'CLIENTE' && this.idClienteFiltro
      ? this.facturaService.listarPorCliente(this.idClienteFiltro)
      : this.facturaService.listarPorEstado(this.estadoFiltro);

    obs.subscribe({
      next: (data) => {
        this.facturasHistorial = data || [];
        this.cargandoHistorial = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.facturasHistorial = [];
        this.cargandoHistorial = false;
        this.cdr.markForCheck();
      }
    });
  }

  descargandoId: number | null = null;

  descargarPdf(f: FacturaResponse): void {
    if (!f.idFactura) return;
    this.descargandoId = f.idFactura;
    this.mensajeError = '';
    this.cdr.markForCheck();

    this.facturaService.descargarPdf(f.idFactura).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${f.serie}-${f.numero || f.idFactura}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.descargandoId = null;
        this.cdr.markForCheck();
      },
      error: () => {
        this.mensajeError = 'No se pudo descargar el PDF de la factura.';
        this.descargandoId = null;
        this.cdr.markForCheck();
      }
    });
  }

  abrirModalEnvio(factura: FacturaResponse): void {
    this.facturaSeleccionada = factura;
    const cliente = this.clientes.find(c => c.idCliente === factura.idCliente);
    this.correoDestino = cliente?.correo || '';
    this.mostrarModalEnvio = true;
    this.cdr.markForCheck();
  }

  cerrarModalEnvio(): void {
    this.mostrarModalEnvio = false;
    this.facturaSeleccionada = null;
    this.correoDestino = '';
    this.cdr.markForCheck();
  }

  enviarCorreoFactura(): void {
    if (!this.facturaSeleccionada?.idFactura || !this.correoDestino) {
      this.mensajeError = 'Indique un correo válido.';
      this.cdr.markForCheck();
      return;
    }

    this.enviandoCorreo = true;
    this.cdr.markForCheck();

    this.facturaService.enviarPorCorreo(this.facturaSeleccionada.idFactura, this.correoDestino).subscribe({
      next: () => {
        this.mensajeExito = `Factura #${this.facturaSeleccionada?.idFactura} despachada correctamente al correo ${this.correoDestino} (vía Ms-envio).`;
        this.enviandoCorreo = false;
        this.cerrarModalEnvio();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.mensajeError = err.error?.message || 'No se pudo conectar con el microservicio de envíos (puerto 8100).';
        this.enviandoCorreo = false;
        this.cdr.markForCheck();
      }
    });
  }

  abrirModalAnular(factura: FacturaResponse): void {
    this.facturaAnular = factura;
    this.motivoAnulacion = '';
    this.mensajeExito = '';
    this.mensajeError = '';
    this.mostrarModalAnular = true;
    this.cdr.markForCheck();
  }

  cerrarModalAnular(): void {
    this.mostrarModalAnular = false;
    this.facturaAnular = null;
    this.motivoAnulacion = '';
    this.cdr.markForCheck();
  }

  anularFactura(): void {
    const motivo = this.motivoAnulacion.trim();
    if (!this.facturaAnular?.idFactura || motivo.length < 3 || motivo.length > 100) {
      this.mensajeError = 'El motivo debe tener entre 3 y 100 caracteres.';
      this.cdr.markForCheck();
      return;
    }

    this.anulando = true;
    this.mensajeError = '';
    this.cdr.markForCheck();

    const serieNumero = `${this.facturaAnular.serie}-${this.facturaAnular.numero}`;

    this.facturaService.anular(this.facturaAnular.idFactura, motivo).subscribe({
      next: () => {
        this.mensajeExito = `Factura ${serieNumero} anulada correctamente.`;
        this.anulando = false;
        this.cerrarModalAnular();
        this.cargarHistorial();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.mensajeError = err.error?.message || 'No se pudo anular la factura.';
        this.anulando = false;
        this.cerrarModalAnular();
        this.cdr.markForCheck();
      }
    });
  }
}
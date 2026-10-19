import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FacturaRequest, FacturaResponse } from '../models/factura.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FacturaService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiFacturas;

  emitir(request: FacturaRequest): Observable<{ encolados: number; mensaje: string }> {
    return this.http.post<{ encolados: number; mensaje: string }>(`${this.apiUrl}/emitir`, request);
  }

  buscarPorId(id: number): Observable<FacturaResponse> {
    return this.http.get<FacturaResponse>(`${this.apiUrl}/${id}`);
  }

  listarPorCliente(idCliente: number): Observable<FacturaResponse[]> {
    return this.http.get<FacturaResponse[]>(`${this.apiUrl}/cliente/${idCliente}`);
  }

  listarPorEstado(estado: string): Observable<FacturaResponse[]> {
    return this.http.get<FacturaResponse[]>(`${this.apiUrl}/estado/${estado}`);
  }

  emitirLote(requests: FacturaRequest[]): Observable<{ encolados: number; mensaje: string }> {
    return this.http.post<{ encolados: number; mensaje: string }>(`${this.apiUrl}/lote`, requests);
  }

  anular(id: number, motivo: string): Observable<FacturaResponse> {
    return this.http.post<FacturaResponse>(`${this.apiUrl}/${id}/anular`, { motivo });
  }

  descargarPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  enviarPorCorreo(idFactura: number, correo: string): Observable<void> {
    return this.http.post<void>(environment.apiEnvios, { idFactura, correo });
  }
}
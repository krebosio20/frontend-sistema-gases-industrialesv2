import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto, MovimientoStock } from '../models/producto.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiProductos;

  listar(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/listar`);
  }

  buscarPorId(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  registrar(dto: Producto): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, dto);
  }

  actualizar(dto: Producto): Observable<Producto> {
    return this.http.put<Producto>(this.apiUrl, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  descontarStock(id: number, cantidad: number, referencia?: string): Observable<Producto> {
    let params = new HttpParams().set('cantidad', cantidad.toString());
    if (referencia) {
      params = params.set('referencia', referencia);
    }
    return this.http.put<Producto>(`${this.apiUrl}/${id}/descontar-stock`, null, { params });
  }

  ingresarStock(id: number, cantidad: number, referencia?: string): Observable<Producto> {
    let params = new HttpParams().set('cantidad', cantidad.toString());
    if (referencia) {
      params = params.set('referencia', referencia);
    }
    return this.http.put<Producto>(`${this.apiUrl}/${id}/ingresar-stock`, null, { params });
  }

  obtenerMovimientos(id: number): Observable<MovimientoStock[]> {
    return this.http.get<MovimientoStock[]>(`${this.apiUrl}/${id}/movimientos`);
  }
}

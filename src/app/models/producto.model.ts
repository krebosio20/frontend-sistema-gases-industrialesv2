export interface Producto {
  idProducto?: number;
  codigoProducto: string;
  nombreProducto: string;
  descripcion?: string;
  unidadMedida: string;
  precio: number;
  stock: number;
  activo: boolean;
}

export interface MovimientoStock {
  idMovimiento?: number;
  idProducto: number;
  tipo: string;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  referencia?: string;
  fecha?: string;
}

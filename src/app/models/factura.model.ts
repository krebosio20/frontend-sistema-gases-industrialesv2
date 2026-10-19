export interface ItemFactura {
  idProducto: number;
  cantidad: number;
  codigoProducto?: string;
  nombreProducto?: string;
  precioUnitario?: number;
  subtotal?: number;
}

export interface FacturaRequest {
  idCliente: number;
  serie: string;
  items: ItemFactura[];
}

export interface DetalleFacturaResponse {
  codigoProducto?: string;
  descripcion?: string;
  unidadMedida?: string;
  cantidad: number;
  valorUnitario: number;
  igv: number;
  total: number;
}

export type EstadoFactura = 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'EXCEPCION' | 'ANULADO';

export interface FacturaResponse {
  idFactura: number;
  serie: string;
  numero: number;
  fechaEmision: string;
  idCliente: number;
  clienteDenominacion?: string;
  clienteNumeroDocumento?: string;
  moneda?: string;
  subtotal: number;
  igv: number;
  total: number;
  estado: EstadoFactura | string;
  documentId?: string;
  urlXml?: string;
  urlCdr?: string;
  urlPdf?: string;
  mensajeSunat?: string;
  detalles: DetalleFacturaResponse[];
}
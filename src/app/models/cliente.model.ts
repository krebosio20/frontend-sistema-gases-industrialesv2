export interface Cliente {
  idCliente?: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  direccion?: string;
  correo?: string;
  telefono?: string;
}

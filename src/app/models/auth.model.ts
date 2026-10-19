export interface LoginRequest {
  username: string;
  password: string;
}

export interface UsuarioJwt {
  idusuario: number;
  nomusuario: string;
  roles: string[];
  token: string;
}

export interface GenericResponse<T> {
  response: T | null;
  error: {
    statusCode: number;
    dateError: string;
    message: string;
  } | null;
}

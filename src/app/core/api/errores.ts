import { HttpErrorResponse } from '@angular/common/http';

/** Convierte un error HTTP en un mensaje entendible para el usuario */
export function mensajeDeError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'No se pudo conectar con el servidor (revisa que la EC2 esté encendida).';
    if (err.status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
    if (err.status === 403) return 'Tu rol no tiene permiso para esta acción.';
    const cuerpo = err.error as { message?: string; details?: string[] } | null;
    if (cuerpo?.message) {
      return cuerpo.details?.length ? `${cuerpo.message}: ${cuerpo.details.join(', ')}` : cuerpo.message;
    }
    return `Error ${err.status}`;
  }
  return 'Ocurrió un error inesperado.';
}

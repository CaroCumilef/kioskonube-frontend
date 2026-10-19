import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Agrega "Authorization: Bearer <JWT>" a todas las llamadas al API Gateway.
 * Si el backend responde 401 (token vencido o inválido), cierra la sesión local.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken();

  const rutasProtegidas = ['/ordenes', '/despachos', '/carrito'];
  const esLlamadaAlApi = rutasProtegidas.some((ruta) => req.url.startsWith(`${environment.apiUrl}${ruta}`));
  const peticion =
    token && esLlamadaAlApi
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(peticion).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        auth.cerrarSesionLocal();
      }
      return throwError(() => err);
    }),
  );
};

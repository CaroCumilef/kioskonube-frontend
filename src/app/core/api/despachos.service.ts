import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Despacho } from './modelos';

/** despachos-service a través del API Gateway */
@Injectable({ providedIn: 'root' })
export class DespachosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/despachos`;

  buscarPorOrden(ordenId: number): Observable<Despacho> {
    return this.http.get<Despacho>(this.url, { params: { ordenId } });
  }

  /** Solo el rol ADMIN puede usarlo (el backend responde 403 a los demás) */
  cambiarEstado(id: number, estado: 'DESPACHADO' | 'ENTREGADO' | 'CANCELADO'): Observable<Despacho> {
    return this.http.patch<Despacho>(`${this.url}/${id}/estado`, { estado });
  }
}

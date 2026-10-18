import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrearOrdenRequest, Orden } from './modelos';

/** ordenes-service a través del API Gateway */
@Injectable({ providedIn: 'root' })
export class OrdenesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/ordenes`;

  crear(request: CrearOrdenRequest): Observable<Orden> {
    return this.http.post<Orden>(this.url, request);
  }

  listarPorCliente(clienteEmail: string): Observable<Orden[]> {
    return this.http.get<Orden[]>(this.url, { params: { clienteEmail } });
  }
}

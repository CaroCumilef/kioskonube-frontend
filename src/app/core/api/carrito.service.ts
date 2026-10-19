import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Carrito, CheckoutResponse, Producto } from './modelos';

/**
 * carrito-service a través del API Gateway.
 * El backend identifica al dueño del carrito por el JWT, por eso no se envía ningún id de usuario.
 */
@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/carrito`;

  obtener(): Observable<Carrito> {
    return this.http.get<Carrito>(this.url);
  }

  agregar(producto: Producto, cantidad = 1): Observable<Carrito> {
    return this.http.post<Carrito>(`${this.url}/items`, {
      productoId: producto.id,
      nombreProducto: producto.nombre,
      precioUnitario: producto.precio,
      cantidad,
    });
  }

  quitarUna(productoId: number): Observable<Carrito> {
    return this.http.delete<Carrito>(`${this.url}/items/${productoId}`);
  }

  /** Publica carrito.checkout en RabbitMQ; ordenes-service crea la orden de forma asíncrona */
  checkout(clienteEmail: string): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.url}/checkout`, { clienteEmail });
  }
}

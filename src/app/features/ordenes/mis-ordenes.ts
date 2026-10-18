import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { DespachosService } from '../../core/api/despachos.service';
import { mensajeDeError } from '../../core/api/errores';
import { Despacho, Orden } from '../../core/api/modelos';
import { OrdenesService } from '../../core/api/ordenes.service';

@Component({
  selector: 'app-mis-ordenes',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="cabecera fila">
      <div>
        <h1>{{ auth.isAdmin() ? 'Órdenes' : 'Mis órdenes' }}</h1>
        <p class="muted">Los estados se actualizan solos por RabbitMQ; usa “Actualizar” para refrescar.</p>
      </div>
      <button class="btn btn-sec" (click)="cargar()">Actualizar</button>
    </div>

    @if (auth.isAdmin()) {
      <form class="buscador" (ngSubmit)="cargar()">
        <label for="email">Cliente</label>
        <input id="email" name="email" type="email" [(ngModel)]="emailBusqueda" placeholder="correo del cliente" />
        <button class="btn btn-peq" type="submit">Buscar</button>
      </form>
    }

    @if (error(); as e) {
      <div class="aviso error">{{ e }}</div>
    }

    @if (cargando()) {
      <p class="muted">Cargando…</p>
    } @else if (ordenes().length === 0) {
      <div class="tarjeta vacio">No hay órdenes para {{ emailBusqueda }}.</div>
    } @else {
      <div class="lista">
        @for (orden of ordenes(); track orden.id) {
          <article class="tarjeta orden">
            <div class="fila">
              <div>
                <h3>Orden #{{ orden.id }}</h3>
                <span class="muted">{{ orden.fechaCreacion | date: 'dd-MM-yyyy HH:mm' }} · {{ orden.origen }}</span>
              </div>
              <span class="estado" [attr.data-estado]="orden.estado">{{ texto(orden.estado) }}</span>
            </div>

            <ul class="items">
              @for (item of orden.items; track item.productoId) {
                <li>
                  <span>{{ item.cantidad }} × {{ item.nombreProducto }}</span>
                  <span>{{ item.subtotal | currency: 'CLP' : 'symbol-narrow' : '1.0-0' }}</span>
                </li>
              }
            </ul>

            <div class="fila pie-orden">
              <strong>Total {{ orden.total | currency: 'CLP' : 'symbol-narrow' : '1.0-0' }}</strong>
              <button class="btn btn-peq btn-sec" (click)="verDespacho(orden.id)">Ver despacho</button>
            </div>

            @if (despachos()[orden.id]; as d) {
              <div class="despacho">
                <div>
                  Despacho <strong>#{{ d.id }}</strong> · seguimiento <code>{{ d.codigoSeguimiento }}</code>
                  · <span class="estado" [attr.data-estado]="d.estado">{{ texto(d.estado) }}</span>
                </div>
                @if (auth.isAdmin()) {
                  <div class="acciones">
                    @if (d.estado === 'EN_PREPARACION') {
                      <button class="btn btn-peq" (click)="cambiar(d, 'DESPACHADO')">Despachar</button>
                    }
                    @if (d.estado === 'DESPACHADO') {
                      <button class="btn btn-peq" (click)="cambiar(d, 'ENTREGADO')">Marcar entregado</button>
                    }
                  </div>
                }
              </div>
            } @else if (despachos()[orden.id] === null) {
              <div class="despacho muted">Esta orden aún no tiene despacho.</div>
            }
          </article>
        }
      </div>
    }
  `,
})
export class MisOrdenes implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly ordenesApi = inject(OrdenesService);
  private readonly despachosApi = inject(DespachosService);

  protected emailBusqueda = this.auth.email();
  protected readonly ordenes = signal<Orden[]>([]);
  /** ordenId -> despacho (null = consultado y no existe) */
  protected readonly despachos = signal<Record<number, Despacho | null>>({});
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.ordenesApi.listarPorCliente(this.emailBusqueda).subscribe({
      next: (lista) => {
        this.ordenes.set(lista);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }

  protected verDespacho(ordenId: number): void {
    this.despachosApi.buscarPorOrden(ordenId).subscribe({
      next: (d) => this.despachos.update((m) => ({ ...m, [ordenId]: d })),
      error: (err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 404) {
          this.despachos.update((m) => ({ ...m, [ordenId]: null }));
        } else {
          this.error.set(mensajeDeError(err));
        }
      },
    });
  }

  protected cambiar(d: Despacho, estado: 'DESPACHADO' | 'ENTREGADO'): void {
    this.error.set(null);
    this.despachosApi.cambiarEstado(d.id, estado).subscribe({
      next: (actualizado) => {
        this.despachos.update((m) => ({ ...m, [actualizado.ordenId]: actualizado }));
        // La orden se actualiza de forma asíncrona (RabbitMQ): refrescamos después de un momento
        setTimeout(() => this.cargar(), 1500);
      },
      error: (err: unknown) => this.error.set(mensajeDeError(err)),
    });
  }

  protected texto(estado: string): string {
    return estado.replace('_', ' ').toLowerCase();
  }
}

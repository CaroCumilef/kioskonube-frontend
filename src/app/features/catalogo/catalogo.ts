import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { mensajeDeError } from '../../core/api/errores';
import { Orden, Producto } from '../../core/api/modelos';
import { OrdenesService } from '../../core/api/ordenes.service';

const PRODUCTOS: Producto[] = [
  { id: 1, nombre: 'Café de grano 500 g', descripcion: 'Tueste medio, origen Colombia.', precio: 8990, icono: '☕' },
  { id: 2, nombre: 'Taza cerámica', descripcion: 'Esmaltada, 350 ml.', precio: 5490, icono: '🍵' },
  { id: 3, nombre: 'Prensa francesa', descripcion: 'Vidrio y acero, 1 litro.', precio: 15990, icono: '🫖' },
  { id: 4, nombre: 'Galletas de avena', descripcion: 'Caja de 12 unidades.', precio: 3290, icono: '🍪' },
  { id: 5, nombre: 'Té verde', descripcion: '20 bolsitas.', precio: 2990, icono: '🌿' },
  { id: 6, nombre: 'Chocolate amargo 70%', descripcion: 'Barra de 100 g.', precio: 2490, icono: '🍫' },
];

@Component({
  selector: 'app-catalogo',
  imports: [CurrencyPipe, RouterLink],
  template: `
    <div class="cabecera">
      <h1>Catálogo</h1>
      <p class="muted">Agrega productos al carrito y confirma tu compra.</p>
    </div>

    <div class="layout-catalogo">
      <div class="grilla">
        @for (p of productos; track p.id) {
          <article class="tarjeta producto">
            <div class="icono">{{ p.icono }}</div>
            <h3>{{ p.nombre }}</h3>
            <p class="muted">{{ p.descripcion }}</p>
            <div class="fila">
              <span class="precio">{{ p.precio | currency: 'CLP' : 'symbol-narrow' : '1.0-0' }}</span>
              <button class="btn btn-peq" (click)="agregar(p.id)">Agregar</button>
            </div>
          </article>
        }
      </div>

      <aside class="tarjeta carrito">
        <h2>Carrito</h2>
        @if (lineas().length === 0) {
          <p class="muted">Aún no agregas productos.</p>
        } @else {
          <ul class="lineas">
            @for (l of lineas(); track l.producto.id) {
              <li>
                <span>{{ l.producto.nombre }}</span>
                <span class="cantidad">
                  <button class="mini" (click)="quitar(l.producto.id)">−</button>
                  {{ l.cantidad }}
                  <button class="mini" (click)="agregar(l.producto.id)">+</button>
                </span>
              </li>
            }
          </ul>
          <div class="total">
            <span>Total</span>
            <strong>{{ total() | currency: 'CLP' : 'symbol-narrow' : '1.0-0' }}</strong>
          </div>
          <button class="btn btn-ancho" [disabled]="enviando()" (click)="comprar()">
            {{ enviando() ? 'Enviando…' : 'Comprar' }}
          </button>
        }

        @if (ordenCreada(); as orden) {
          <div class="aviso ok">
            Orden <strong>#{{ orden.id }}</strong> creada. Te llegará un correo de confirmación.
            <a routerLink="/mis-ordenes">Ver mis órdenes →</a>
          </div>
        }
        @if (error(); as e) {
          <div class="aviso error">{{ e }}</div>
        }
      </aside>
    </div>
  `,
})
export class Catalogo {
  private readonly auth = inject(AuthService);
  private readonly ordenes = inject(OrdenesService);

  protected readonly productos = PRODUCTOS;
  private readonly carrito = signal<Record<number, number>>({});
  protected readonly enviando = signal(false);
  protected readonly ordenCreada = signal<Orden | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly lineas = computed(() =>
    this.productos
      .filter((p) => (this.carrito()[p.id] ?? 0) > 0)
      .map((p) => ({ producto: p, cantidad: this.carrito()[p.id] ?? 0 })),
  );

  protected readonly total = computed(() =>
    this.lineas().reduce((suma, l) => suma + l.producto.precio * l.cantidad, 0),
  );

  protected agregar(id: number): void {
    this.carrito.update((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  }

  protected quitar(id: number): void {
    this.carrito.update((c) => ({ ...c, [id]: Math.max((c[id] ?? 0) - 1, 0) }));
  }

  protected comprar(): void {
    this.enviando.set(true);
    this.error.set(null);
    this.ordenCreada.set(null);

    this.ordenes
      .crear({
        clienteEmail: this.auth.email(),
        items: this.lineas().map((l) => ({
          productoId: l.producto.id,
          nombreProducto: l.producto.nombre,
          cantidad: l.cantidad,
          precioUnitario: l.producto.precio,
        })),
      })
      .subscribe({
        next: (orden) => {
          this.ordenCreada.set(orden);
          this.carrito.set({});
          this.enviando.set(false);
        },
        error: (err: unknown) => {
          this.error.set(mensajeDeError(err));
          this.enviando.set(false);
        },
      });
  }
}

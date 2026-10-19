import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { CarritoService } from '../../core/api/carrito.service';
import { mensajeDeError } from '../../core/api/errores';
import { Carrito, CheckoutResponse, Producto } from '../../core/api/modelos';

const PRODUCTOS: Producto[] = [
  { id: 1, nombre: 'Café de grano 500 g', descripcion: 'Tueste medio, origen Colombia.', precio: 8990, icono: '☕' },
  { id: 2, nombre: 'Taza cerámica', descripcion: 'Esmaltada, 350 ml.', precio: 5490, icono: '🍵' },
  { id: 3, nombre: 'Prensa francesa', descripcion: 'Vidrio y acero, 1 litro.', precio: 15990, icono: '🫖' },
  { id: 4, nombre: 'Galletas de avena', descripcion: 'Caja de 12 unidades.', precio: 3290, icono: '🍪' },
  { id: 5, nombre: 'Té verde', descripcion: '20 bolsitas.', precio: 2990, icono: '🌿' },
  { id: 6, nombre: 'Chocolate amargo 70%', descripcion: 'Barra de 100 g.', precio: 2490, icono: '🍫' },
];

const CARRITO_VACIO: Carrito = { items: [], unidades: 0, total: 0 };

@Component({
  selector: 'app-catalogo',
  imports: [CurrencyPipe, RouterLink],
  template: `
    <div class="cabecera">
      <h1>Catálogo</h1>
      <p class="muted">Agrega productos al carrito y confirma tu compra. Tu carrito se guarda en la nube.</p>
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
              <button class="btn btn-peq" [disabled]="ocupado()" (click)="agregar(p)">Agregar</button>
            </div>
          </article>
        }
      </div>

      <aside class="tarjeta carrito">
        <h2>Carrito</h2>
        @if (cargando()) {
          <p class="muted">Cargando carrito…</p>
        } @else if (carrito().items.length === 0) {
          <p class="muted">Aún no agregas productos.</p>
        } @else {
          <ul class="lineas">
            @for (l of carrito().items; track l.productoId) {
              <li>
                <span>{{ l.nombreProducto }}</span>
                <span class="cantidad">
                  <button class="mini" [disabled]="ocupado()" (click)="quitar(l.productoId)">−</button>
                  {{ l.cantidad }}
                  <button class="mini" [disabled]="ocupado()" (click)="agregarPorId(l.productoId)">+</button>
                </span>
              </li>
            }
          </ul>
          <div class="total">
            <span>Total</span>
            <strong>{{ carrito().total | currency: 'CLP' : 'symbol-narrow' : '1.0-0' }}</strong>
          </div>
          <button class="btn btn-ancho" [disabled]="ocupado()" (click)="comprar()">
            {{ enviando() ? 'Enviando…' : 'Comprar' }}
          </button>
        }

        @if (compra(); as c) {
          <div class="aviso ok">
            Compra enviada ({{ c.unidades }} productos, {{ c.total | currency: 'CLP' : 'symbol-narrow' : '1.0-0' }}).
            Tu orden se está creando y te llegará un correo de confirmación.
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
export class Catalogo implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(CarritoService);

  protected readonly productos = PRODUCTOS;
  protected readonly carrito = signal<Carrito>(CARRITO_VACIO);
  protected readonly cargando = signal(true);
  protected readonly ocupado = signal(false);
  protected readonly enviando = signal(false);
  protected readonly compra = signal<CheckoutResponse | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.obtener().subscribe({
      next: (c) => {
        this.carrito.set(c);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }

  protected agregar(producto: Producto): void {
    this.compra.set(null);
    this.ejecutar(this.api.agregar(producto));
  }

  protected agregarPorId(productoId: number): void {
    const producto = this.productos.find((p) => p.id === productoId);
    if (producto) this.agregar(producto);
  }

  protected quitar(productoId: number): void {
    this.ejecutar(this.api.quitarUna(productoId));
  }

  protected comprar(): void {
    this.ocupado.set(true);
    this.enviando.set(true);
    this.error.set(null);
    this.compra.set(null);

    this.api.checkout(this.auth.email()).subscribe({
      next: (respuesta) => {
        this.compra.set(respuesta);
        this.carrito.set(CARRITO_VACIO);
        this.ocupado.set(false);
        this.enviando.set(false);
      },
      error: (err: unknown) => {
        this.error.set(mensajeDeError(err));
        this.ocupado.set(false);
        this.enviando.set(false);
      },
    });
  }

  /** Llama al carrito-service y reemplaza el carrito con la respuesta del backend */
  private ejecutar(peticion: Observable<Carrito>): void {
    this.ocupado.set(true);
    this.error.set(null);
    peticion.subscribe({
      next: (c) => {
        this.carrito.set(c);
        this.ocupado.set(false);
      },
      error: (err: unknown) => {
        this.error.set(mensajeDeError(err));
        this.ocupado.set(false);
      },
    });
  }
}

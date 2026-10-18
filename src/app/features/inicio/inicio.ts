import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  template: `
    @if (auth.isLoggedIn()) {
      <section class="hero">
        <p class="eyebrow">Sesión iniciada con Amazon Cognito</p>
        <h1>Hola, {{ auth.email() }}</h1>
        <p class="lead">
          Tu rol es <span class="chip" [class.chip-admin]="auth.isAdmin()">{{ auth.rol() }}</span>.
          @if (auth.isAdmin()) {
            Puedes comprar y además despachar y entregar órdenes.
          } @else {
            Puedes comprar y seguir el estado de tus órdenes.
          }
        </p>
        <div class="acciones">
          <a class="btn" routerLink="/catalogo">Ir al catálogo</a>
          <a class="btn btn-sec" routerLink="/mis-ordenes">Ver mis órdenes</a>
        </div>
      </section>
    } @else {
      <section class="hero">
        <p class="eyebrow">E-commerce cloud native</p>
        <h1>Tu kiosko, en la nube.</h1>
        <p class="lead">
          Compra, sigue tu despacho y recibe cada cambio por correo. Inicia sesión o crea tu cuenta
          para comenzar.
        </p>
        <div class="acciones">
          <button class="btn" (click)="auth.login()">Iniciar sesión</button>
          <button class="btn btn-sec" (click)="auth.registrarse()">Crear cuenta</button>
        </div>
      </section>
    }

    <section class="flujo">
      <h2>Qué pasa cuando compras</h2>
      <ol>
        <li><strong>Órdenes</strong> guarda tu compra en PostgreSQL y publica <code>orden.creada</code> en RabbitMQ.</li>
        <li><strong>Despachos</strong> consume ese evento y crea el despacho automáticamente.</li>
        <li>Cada cambio de estado vuelve a <strong>Órdenes</strong> por <code>despacho.actualizado</code>.</li>
        <li><strong>Notificaciones</strong> te envía un correo en cada paso.</li>
      </ol>
    </section>
  `,
})
export class Inicio {
  protected readonly auth = inject(AuthService);
}

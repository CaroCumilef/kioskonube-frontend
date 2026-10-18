import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="barra">
      <a routerLink="/" class="marca"><span class="logo">K</span>KioskoNube</a>

      @if (auth.isLoggedIn()) {
        <nav class="menu">
          <a routerLink="/catalogo" routerLinkActive="activo">Catálogo</a>
          <a routerLink="/mis-ordenes" routerLinkActive="activo">Mis órdenes</a>
        </nav>
        <div class="usuario">
          <span class="correo">{{ auth.email() }}</span>
          <span class="chip" [class.chip-admin]="auth.isAdmin()">{{ auth.rol() }}</span>
          <button class="btn btn-sec" (click)="auth.logout()">Cerrar sesión</button>
        </div>
      } @else {
        <div class="usuario">
          <button class="btn" (click)="auth.login()">Iniciar sesión</button>
        </div>
      }
    </header>

    <main class="contenido">
      <router-outlet />
    </main>

    <footer class="pie">
      Angular · Amazon Cognito · API Gateway · Spring Boot · RabbitMQ · PostgreSQL (RDS)
    </footer>
  `,
})
export class App {
  protected readonly auth = inject(AuthService);
}

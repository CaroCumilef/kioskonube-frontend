import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { Inicio } from './features/inicio/inicio';
import { Catalogo } from './features/catalogo/catalogo';
import { MisOrdenes } from './features/ordenes/mis-ordenes';

export const routes: Routes = [
  { path: '', component: Inicio, title: 'KioskoNube' },
  { path: 'catalogo', component: Catalogo, canActivate: [authGuard], title: 'Catálogo · KioskoNube' },
  { path: 'mis-ordenes', component: MisOrdenes, canActivate: [authGuard], title: 'Mis órdenes · KioskoNube' },
  { path: '**', redirectTo: '' },
];

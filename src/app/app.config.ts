import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { AuthService } from './core/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // Interceptor: agrega el JWT a cada llamada al API Gateway
    provideHttpClient(withInterceptors([authInterceptor])),
    // Al volver desde Cognito (?code=...), cambia el código por los tokens antes de iniciar la app
    provideAppInitializer(() => inject(AuthService).procesarRetornoDeCognito()),
  ],
};

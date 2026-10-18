# KioskoNube - Frontend (Angular)

Frontend de KioskoNube. Login y registro con **Amazon Cognito** (IDaaS, OIDC con PKCE)
y llamadas al backend a través de **AWS API Gateway** enviando el JWT en `Authorization: Bearer`.

## Funcionalidades

- Iniciar sesión y crear cuenta en la página administrada de Cognito.
- Catálogo con carrito y compra (`POST /ordenes`).
- Mis órdenes (`GET /ordenes?clienteEmail=`) y estado del despacho (`GET /despachos?ordenId=`).
- Rol **ADMIN**: despachar y entregar (`PATCH /despachos/{id}/estado`).

## Estructura

    src/app
    ├── core/auth      AuthService (OIDC + PKCE), interceptor JWT, guard
    ├── core/api       servicios HTTP de órdenes y despachos, modelos
    └── features       inicio, catálogo, mis órdenes

## Ejecutar

    npm install
    npm start        # http://localhost:5173

En desarrollo, `proxy.conf.json` reenvía `/ordenes` y `/despachos` al API Gateway,
así el navegador ve un solo origen y no necesita CORS.

La configuración (Cognito y URL del API Gateway) está en `src/environments/environment.ts`.

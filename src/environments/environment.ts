/**
 * Configuración del frontend. No contiene secretos: el Client ID de Cognito y la URL
 * del API Gateway son identificadores públicos que el navegador necesita conocer.
 */
export const environment = {
  /**
   * La API se llama con rutas relativas (/ordenes, /despachos), en el mismo origen que el frontend:
   *  - En la nube: el frontend se sirve desde el mismo API Gateway (sin CORS).
   *  - En desarrollo: el proxy de Angular (proxy.conf.json) reenvía esas rutas al API Gateway.
   * API Gateway: https://dhbzn4b51f.execute-api.us-east-1.amazonaws.com (JWT Authorizer de Cognito)
   */
  apiUrl: '',

  cognito: {
    /** Emisor (issuer) del User Pool */
    authority: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_fWu8FjuqE',
    /** App client "kioskonube-frontend" */
    clientId: 'ero110hm0q68obg9p31bjto3o',
    scope: 'openid email phone',
  },
};

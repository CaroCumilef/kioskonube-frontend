/**
 * Configuración del frontend. No contiene secretos: el Client ID de Cognito y la URL
 * del API Gateway son identificadores públicos que el navegador necesita conocer.
 *
 * Arquitectura:
 *  - Frontend: API Gateway "kioskonube-front" → https://xxqczn7xl2.execute-api.us-east-1.amazonaws.com
 *  - Backend:  API Gateway "kioskonube-api"   → https://dhbzn4b51f.execute-api.us-east-1.amazonaws.com
 *    (rutas explícitas, JWT Authorizer de Cognito y CORS que solo permite el origen del frontend)
 */
export const environment = {
  /** URL del API Gateway del backend */
  apiUrl: 'https://dhbzn4b51f.execute-api.us-east-1.amazonaws.com',

  cognito: {
    /** Emisor (issuer) del User Pool */
    authority: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_fWu8FjuqE',
    /** App client "kioskonube-frontend" */
    clientId: 'ero110hm0q68obg9p31bjto3o',
    scope: 'openid email phone',
  },
};
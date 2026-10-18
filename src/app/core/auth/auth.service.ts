import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Endpoints publicados por Cognito en su documento de descubrimiento OIDC */
interface Descubrimiento {
  authorization_endpoint: string;
  token_endpoint: string;
}

type Payload = Record<string, unknown>;

const CLAVE_ACCESS = 'kn_access_token';
const CLAVE_ID = 'kn_id_token';
const CLAVE_VERIFIER = 'kn_pkce_verifier';
const CLAVE_STATE = 'kn_pkce_state';

/**
 * Autenticación con Amazon Cognito (IDaaS) usando OpenID Connect:
 * flujo "authorization code" con PKCE, el recomendado para aplicaciones de una sola página.
 *
 * 1. login(): redirige a la página de inicio de sesión de Cognito.
 * 2. Cognito vuelve a http://localhost:5173/?code=...
 * 3. procesarRetornoDeCognito(): cambia ese código por los tokens JWT.
 * 4. El interceptor envía el access token en cada llamada al API Gateway.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly cfg = environment.cognito;
  private readonly redirectUri = window.location.origin + '/';
  private descubrimiento?: Promise<Descubrimiento>;

  readonly accessToken = signal<string | null>(sessionStorage.getItem(CLAVE_ACCESS));
  readonly idToken = signal<string | null>(sessionStorage.getItem(CLAVE_ID));

  private readonly accessPayload = computed(() => decodificar(this.accessToken()));
  private readonly idPayload = computed(() => decodificar(this.idToken()));

  readonly isLoggedIn = computed(() => {
    const exp = this.accessPayload()?.['exp'];
    return typeof exp === 'number' && exp * 1000 > Date.now();
  });

  readonly email = computed(() => {
    const email = this.idPayload()?.['email'];
    return typeof email === 'string' ? email : '';
  });

  /** Grupos de Cognito (ADMIN, CLIENTE) que vienen dentro del JWT */
  readonly grupos = computed<string[]>(() => {
    const grupos = this.accessPayload()?.['cognito:groups'];
    return Array.isArray(grupos) ? grupos.map(String) : [];
  });

  readonly isAdmin = computed(() => this.grupos().includes('ADMIN'));

  readonly rol = computed(() => {
    if (this.isAdmin()) return 'ADMIN';
    if (this.grupos().includes('CLIENTE')) return 'CLIENTE';
    return 'SIN ROL';
  });

  /** Abre la página de inicio de sesión de Cognito */
  login(): Promise<void> {
    return this.redirigir('/oauth2/authorize');
  }

  /** Abre la página de registro de Cognito (crear cuenta nueva) */
  registrarse(): Promise<void> {
    return this.redirigir('/signup');
  }

  /** Cierra la sesión en la app y también en Cognito */
  async logout(): Promise<void> {
    this.cerrarSesionLocal();
    const d = await this.obtenerDescubrimiento();
    const dominio = new URL(d.authorization_endpoint).origin;
    const params = new URLSearchParams({ client_id: this.cfg.clientId, logout_uri: this.redirectUri });
    window.location.href = `${dominio}/logout?${params}`;
  }

  /** Borra los tokens guardados en el navegador */
  cerrarSesionLocal(): void {
    sessionStorage.removeItem(CLAVE_ACCESS);
    sessionStorage.removeItem(CLAVE_ID);
    this.accessToken.set(null);
    this.idToken.set(null);
  }

  /** Si la URL trae ?code=..., lo cambia por los tokens (se ejecuta al iniciar la app) */
  async procesarRetornoDeCognito(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;

    const stateEsperado = sessionStorage.getItem(CLAVE_STATE);
    const verifier = sessionStorage.getItem(CLAVE_VERIFIER);
    sessionStorage.removeItem(CLAVE_STATE);
    sessionStorage.removeItem(CLAVE_VERIFIER);
    // Limpia la URL para que el código no quede a la vista
    window.history.replaceState({}, '', '/');

    if (!verifier || params.get('state') !== stateEsperado) {
      console.warn('Respuesta de Cognito no válida (state distinto). Inicia sesión nuevamente.');
      return;
    }

    try {
      const d = await this.obtenerDescubrimiento();
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.cfg.clientId,
        code,
        redirect_uri: this.redirectUri,
        code_verifier: verifier,
      });
      const respuesta = await fetch(d.token_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!respuesta.ok) {
        console.error('Cognito rechazó el código', respuesta.status, await respuesta.text());
        return;
      }
      const tokens = (await respuesta.json()) as { access_token: string; id_token: string };
      sessionStorage.setItem(CLAVE_ACCESS, tokens.access_token);
      sessionStorage.setItem(CLAVE_ID, tokens.id_token);
      this.accessToken.set(tokens.access_token);
      this.idToken.set(tokens.id_token);
    } catch (e) {
      console.error('No se pudo completar el inicio de sesión', e);
    }
  }

  private async redirigir(ruta: '/oauth2/authorize' | '/signup'): Promise<void> {
    const verifier = aleatorio(48);
    const state = aleatorio(16);
    sessionStorage.setItem(CLAVE_VERIFIER, verifier);
    sessionStorage.setItem(CLAVE_STATE, state);

    const d = await this.obtenerDescubrimiento();
    const dominio = new URL(d.authorization_endpoint).origin;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.cfg.clientId,
      redirect_uri: this.redirectUri,
      scope: this.cfg.scope,
      state,
      code_challenge: await desafioPkce(verifier),
      code_challenge_method: 'S256',
    });
    window.location.href = `${dominio}${ruta}?${params}`;
  }

  private obtenerDescubrimiento(): Promise<Descubrimiento> {
    this.descubrimiento ??= fetch(`${this.cfg.authority}/.well-known/openid-configuration`)
      .then((r) => r.json() as Promise<Descubrimiento>);
    return this.descubrimiento;
  }
}

// ---- utilidades ----

function base64Url(bytes: Uint8Array): string {
  let texto = '';
  bytes.forEach((b) => (texto += String.fromCharCode(b)));
  return btoa(texto).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function aleatorio(largo: number): string {
  const bytes = new Uint8Array(largo);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function desafioPkce(verifier: string): Promise<string> {
  const datos = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', datos as BufferSource);
  return base64Url(new Uint8Array(hash));
}

/** Lee el contenido (payload) de un JWT. No valida la firma: eso lo hacen el API Gateway y el backend. */
function decodificar(token: string | null): Payload | null {
  if (!token) return null;
  try {
    const parte = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(parte)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json) as Payload;
  } catch {
    return null;
  }
}

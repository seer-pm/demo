import jwt from "jsonwebtoken";

export const X_OAUTH_COOKIE = "seer_x_oauth";
/** The cookie only needs to reach the callback, so no other request carries the PKCE verifier. */
export const X_OAUTH_COOKIE_PATH = "/.netlify/functions/x-callback";
export const X_OAUTH_TTL_SECONDS = 10 * 60;

/**
 * An audience of its own keeps this JWT from being accepted anywhere a session token is. It also has no
 * `sub`, so `verifyToken` in `auth.ts` rejects it even though both are signed with `JWT_SECRET`.
 */
const AUDIENCE = "seer-x-oauth";

export type XOAuthConfig = { clientId: string; clientSecret: string; redirectUri: string; appOrigin: string };

export type XOAuthSession = { address: string; state: string; codeVerifier: string };

/** Reads the X app credentials, or null when the deployment has not configured them. */
export function getXOAuthConfig(): XOAuthConfig | null {
  const { X_CLIENT_ID, X_CLIENT_SECRET, X_REDIRECT_URI } = process.env;
  if (!X_CLIENT_ID || !X_CLIENT_SECRET || !X_REDIRECT_URI) {
    console.error("X OAuth is not configured: set X_CLIENT_ID, X_CLIENT_SECRET and X_REDIRECT_URI");
    return null;
  }
  // The callback lives on the same origin as the app, so returning the user to /profile follows the
  // redirect URI rather than a second setting that could disagree with it.
  return {
    clientId: X_CLIENT_ID,
    clientSecret: X_CLIENT_SECRET,
    redirectUri: X_REDIRECT_URI,
    appOrigin: new URL(X_REDIRECT_URI).origin,
  };
}

export function signXOAuthSession(session: XOAuthSession): string {
  return jwt.sign(session, process.env.JWT_SECRET!, { audience: AUDIENCE, expiresIn: X_OAUTH_TTL_SECONDS });
}

/** Returns the session from a valid, unexpired cookie token, or null. */
export function verifyXOAuthSession(token: string | undefined): XOAuthSession | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, { audience: AUDIENCE }) as Partial<XOAuthSession>;
    if (
      typeof decoded.address !== "string" ||
      typeof decoded.state !== "string" ||
      typeof decoded.codeVerifier !== "string"
    ) {
      return null;
    }
    return { address: decoded.address, state: decoded.state, codeVerifier: decoded.codeVerifier };
  } catch {
    return null;
  }
}

/** Serializes the flow cookie. `Max-Age=0` with an empty value deletes it. */
export function xOAuthCookie(value: string, maxAge: number): string {
  return `${X_OAUTH_COOKIE}=${value}; Path=${X_OAUTH_COOKIE_PATH}; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

export function basicAuth(config: XOAuthConfig): string {
  return `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`;
}

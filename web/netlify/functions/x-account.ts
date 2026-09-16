import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./utils/auth";
import { CORS_HEADERS } from "./utils/common";
import { X_OAUTH_TTL_SECONDS, getXOAuthConfig, signXOAuthSession, xOAuthCookie } from "./utils/x-oauth";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);
const jsonHeaders = { "Content-Type": "application/json", ...CORS_HEADERS };

/** Creates a JSON response with the function's standard CORS headers. */
function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...jsonHeaders, ...extraHeaders } });
}

/** Starts X account verification (POST) or unlinks the verified account (DELETE) for the signed-in wallet. */
export default async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

  const viewer = verifyToken(req.headers.get("Authorization"));
  if (!viewer) return json({ error: "Unauthorized" }, 401);

  try {
    if (req.method === "POST") {
      const config = getXOAuthConfig();
      if (!config) return json({ error: "X verification is not available" }, 500);

      const state = randomBytes(32).toString("base64url");
      const codeVerifier = randomBytes(32).toString("base64url");
      const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

      const authorizeUrl = new URL("https://x.com/i/oauth2/authorize");
      authorizeUrl.search = new URLSearchParams({
        response_type: "code",
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        // `GET /2/users/me` requires both scopes; nothing is posted or read beyond the user's own profile.
        scope: "tweet.read users.read",
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      }).toString();

      // The wallet travels in a cookie rather than in `state`, so the callback only completes in the
      // browser that started the flow. Otherwise anyone could send a victim an authorize link minted for
      // their own wallet and attach the victim's X account to it.
      const cookie = xOAuthCookie(signXOAuthSession({ address: viewer, state, codeVerifier }), X_OAUTH_TTL_SECONDS);
      return json({ url: authorizeUrl.toString() }, 200, { "Set-Cookie": cookie });
    }

    if (req.method === "DELETE") {
      const { error } = await supabase.from("users").update({ x_user_id: null, x_account: null }).eq("id", viewer);
      if (error) return json({ error: "Unable to disconnect X account" }, 500);
      return json({ success: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (error) {
    console.error("x-account function error:", error);
    return json({ error: "Internal server error" }, 500);
  }
};

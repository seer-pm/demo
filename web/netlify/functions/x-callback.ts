import { createClient } from "@supabase/supabase-js";
import {
  type XOAuthConfig,
  X_OAUTH_COOKIE,
  basicAuth,
  getXOAuthConfig,
  readCookie,
  verifyXOAuthSession,
  xOAuthCookie,
} from "./utils/x-oauth";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

type XResult = "linked" | "taken" | "cancelled" | "error";

/** Sends the browser back to /profile with the outcome, deleting the single-use flow cookie either way. */
function redirect(origin: string, result: XResult) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${origin}/profile?x=${result}`,
      "Set-Cookie": xOAuthCookie("", 0),
      "Cache-Control": "no-store",
    },
  });
}

async function exchangeCode(config: XOAuthConfig, code: string, codeVerifier: string): Promise<string> {
  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: basicAuth(config) },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
      code_verifier: codeVerifier,
    }),
  });
  const body = (await response.json().catch(() => ({}))) as { access_token?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(`X token exchange failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return body.access_token;
}

async function fetchXUser(accessToken: string): Promise<{ id: string; username: string }> {
  const response = await fetch("https://api.x.com/2/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = (await response.json().catch(() => ({}))) as { data?: { id?: string; username?: string } };
  if (!response.ok || !body.data?.id || !body.data.username) {
    throw new Error(`X users/me failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return { id: body.data.id, username: body.data.username };
}

/** Seer only needs the token for one lookup, so it is revoked rather than left valid for its full lifetime. */
async function revokeToken(config: XOAuthConfig, accessToken: string) {
  await fetch("https://api.x.com/2/oauth2/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: basicAuth(config) },
    body: new URLSearchParams({ token: accessToken, token_type_hint: "access_token" }),
  }).catch((error) => console.error("X token revoke failed:", error));
}

/** Completes X OAuth: proves the wallet from the flow cookie controls the X account, then records it. */
export default async (req: Request) => {
  const config = getXOAuthConfig();
  if (!config) return new Response("X verification is not available", { status: 500 });

  try {
    const url = new URL(req.url);
    const session = verifyXOAuthSession(readCookie(req, X_OAUTH_COOKIE));
    const state = url.searchParams.get("state");
    if (!session || !state || state !== session.state) return redirect(config.appOrigin, "error");

    if (url.searchParams.get("error")) return redirect(config.appOrigin, "cancelled");
    const code = url.searchParams.get("code");
    if (!code) return redirect(config.appOrigin, "error");

    const accessToken = await exchangeCode(config, code, session.codeVerifier);
    let xUser: { id: string; username: string };
    try {
      xUser = await fetchXUser(accessToken);
    } finally {
      await revokeToken(config, accessToken);
    }
    const handle = xUser.username.toLowerCase();

    // X just confirmed who owns this handle now, so another wallet showing it under a different X id
    // holds a copy from before a rename or recycle. The pair is cleared together, as the schema requires.
    const { error: staleError } = await supabase
      .from("users")
      .update({ x_user_id: null, x_account: null })
      .eq("x_account", handle)
      .neq("x_user_id", xUser.id);
    if (staleError) throw staleError;

    const { error } = await supabase
      .from("users")
      .update({ x_user_id: xUser.id, x_account: handle })
      .eq("id", session.address)
      .select("id")
      .single();
    if (error?.code === "23505") return redirect(config.appOrigin, "taken");
    if (error) throw error;

    return redirect(config.appOrigin, "linked");
  } catch (error) {
    console.error("x-callback function error:", error);
    return redirect(config.appOrigin, "error");
  }
};

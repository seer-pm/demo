import { normalizeUsername, validateUsername } from "@/lib/username";
import { createClient } from "@supabase/supabase-js";
import { isAddress } from "viem";
import { verifyToken } from "./utils/auth";
import { CORS_HEADERS } from "./utils/common";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);
const jsonHeaders = { "Content-Type": "application/json", ...CORS_HEADERS };

type PublicUser = {
  address: string;
  username: string;
};

/** Creates a JSON response with the function's standard CORS headers. */
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

/** Converts a complete database profile to its public representation. */
function publicUser(row: { id: string; username: string }): PublicUser {
  return { address: row.id.toLowerCase(), username: row.username };
}

/** Finds a user by their normalized username. */
async function findByUsername(username: string): Promise<{ id: string; username: string } | null> {
  const { data, error } = await supabase.from("users").select("id, username").eq("username", username).maybeSingle();
  if (error) throw error;
  return data;
}

/** Handles public profile lookup and authenticated username updates. */
export default async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const url = new URL(req.url);

    if (req.method === "GET") {
      const usernameParam = url.searchParams.get("username");
      const addressParam = url.searchParams.get("address");

      if (usernameParam !== null) {
        const username = normalizeUsername(usernameParam);
        const validationError = validateUsername(username);
        if (validationError) return json({ error: validationError }, 400);
        const data = await findByUsername(username);
        return data ? json({ user: publicUser(data) }) : json({ error: "User not found" }, 404);
      }

      if (addressParam !== null) {
        if (!isAddress(addressParam)) return json({ error: "Invalid address" }, 400);
        const { data, error } = await supabase
          .from("users")
          .select("id, username")
          .eq("id", addressParam.toLowerCase())
          .maybeSingle();
        if (error) throw error;
        return data ? json({ user: publicUser(data) }) : json({ error: "User not found" }, 404);
      }

      return json({ error: "Provide username or address" }, 400);
    }

    const viewer = verifyToken(req.headers.get("Authorization"));
    if (!viewer) return json({ error: "Unauthorized" }, 401);

    if (req.method === "PATCH") {
      const body = (await req.json().catch(() => ({}))) as { username?: unknown };
      if (typeof body.username !== "string") return json({ error: "Username is required" }, 400);

      const username = normalizeUsername(body.username);
      const validationError = validateUsername(username);
      if (validationError) return json({ error: validationError }, 400);

      const { data, error } = await supabase
        .from("users")
        .update({ username })
        .eq("id", viewer)
        .select("id, username")
        .single();

      if (error?.code === "23505") return json({ error: "Username is already taken" }, 409);
      if (error || !data) return json({ error: "Unable to save username" }, 500);
      return json({ user: publicUser(data) });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (error) {
    console.error("users function error:", error);
    return json({ error: "Internal server error" }, 500);
  }
};

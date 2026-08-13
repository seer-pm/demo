const HEADER = "x-netlify-background-secret";

function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

/** Returns a 401 Response if the shared background secret is missing or invalid. */
export function requireBackgroundSecret(req: Request): Response | null {
  const expected = process.env.NETLIFY_BACKGROUND_SECRET;
  if (!expected) {
    console.error("NETLIFY_BACKGROUND_SECRET is not configured");
    return unauthorizedResponse();
  }
  if (req.headers.get(HEADER) !== expected) {
    console.error("rejected (missing or invalid secret)");
    return unauthorizedResponse();
  }
  return null;
}

/** Headers to trigger a background function, or null if the secret is not configured. */
export function backgroundSecretHeaders(): Record<string, string> | null {
  const secret = process.env.NETLIFY_BACKGROUND_SECRET;
  if (!secret) {
    return null;
  }
  return { [HEADER]: secret };
}

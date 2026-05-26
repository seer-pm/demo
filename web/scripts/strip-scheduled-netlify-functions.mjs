// Build-time only. Scheduled functions (cron) belong on the main site only (app.seer.pm).
// On every other Netlify site (staging, previews, forks, etc.), set
// EXCLUDE_SCHEDULED_FUNCTIONS=true in Site configuration → Environment variables.
// The main site must not set this variable.
import { readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const FUNCTIONS_DIR = "web/netlify/functions";

if (process.env.EXCLUDE_SCHEDULED_FUNCTIONS !== "true") {
  process.exit(0);
}

const removed = [];
for (const name of readdirSync(FUNCTIONS_DIR)) {
  if (!name.startsWith("scheduled")) continue;
  unlinkSync(join(FUNCTIONS_DIR, name));
  removed.push(name);
}

console.log(
  `[strip-scheduled-netlify-functions] removed ${removed.length} file(s): ${removed.join(", ") || "(none)"}`,
);

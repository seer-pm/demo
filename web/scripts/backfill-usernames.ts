import { createClient } from "@supabase/supabase-js";
import { makeUsername } from "../netlify/functions/utils/username";

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_PROJECT_URL and SUPABASE_API_KEY are required");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function assignUsername(id: string) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const username = makeUsername(attempt === 0 ? id.toLowerCase() : undefined);
    const { data, error } = await supabase
      .from("users")
      .update({ username })
      .eq("id", id)
      .is("username", null)
      .select("id")
      .maybeSingle();

    if (!error && data) return true;
    if (!error) {
      const { data: currentUser, error: lookupError } = await supabase
        .from("users")
        .select("username")
        .eq("id", id)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (currentUser?.username) return false;
      throw new Error(`Unable to update ${id}; check that SUPABASE_API_KEY can update every user`);
    }
    if (error.code !== "23505") throw error;
  }

  throw new Error(`Unable to assign a unique username to ${id}`);
}

async function main() {
  let updated = 0;

  while (true) {
    const { data: users, error } = await supabase.from("users").select("id").is("username", null).limit(1000);
    if (error) throw error;
    if (!users?.length) break;

    for (const user of users) {
      if (await assignUsername(user.id)) updated += 1;
    }
  }

  console.log(`Assigned generated usernames to ${updated} users.`);
}

await main();

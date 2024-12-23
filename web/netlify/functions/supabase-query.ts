import type { HandlerContext, HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

require("dotenv").config();

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const [tableName, recordId] = event.path
    .split("/")
    .slice(event.path.split("/").indexOf("supabase-query") + 1, event.path.split("/").indexOf("supabase-query") + 3);
  if (!tableName) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "No table selected." }),
    };
  }
  // Create a single supabase client for interacting with your database
  try {
    const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);
    const { data, error } = await (recordId
      ? supabase.from(tableName).select().eq("id", recordId)
      : supabase.from(tableName).select());
    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: error.message }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ data }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: e.message }),
    };
  }
};

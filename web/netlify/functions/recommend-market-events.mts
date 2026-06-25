import { verifyAdminToken } from "./utils/auth";
import { CORS_HEADERS } from "./utils/common";
import {
  MARKET_EVENT_SUGGESTIONS_SCHEMA,
  buildRecommendEventsPrompt,
  formatKnownDatesForPrompt,
  parseRecommendEventsContent,
} from "./utils/recommendMarketEventsPrompt";

const jsonHeaders = { "Content-Type": "application/json", ...CORS_HEADERS };

const XAI_RESPONSES_URL = "https://api.x.ai/v1/responses";

type KnownMarketEventDate = {
  date?: string;
  title?: string;
  description?: string;
};

type RecommendEventsRequest = {
  marketQuestion?: string;
  knownDates?: KnownMarketEventDate[];
};

type XaiOutputTextBlock = {
  type?: string;
  text?: string;
};

type XaiOutputItem = {
  type?: string;
  role?: string;
  content?: XaiOutputTextBlock[] | string;
};

type XaiResponsesResponse = {
  output?: XaiOutputItem[];
  output_text?: string;
};

function extractXaiResponseText(data: XaiResponsesResponse): string {
  if (data.output_text?.trim()) {
    return data.output_text.trim();
  }

  const textParts: string[] = [];

  for (const item of data.output ?? []) {
    if (item.type !== "message" || !Array.isArray(item.content)) {
      continue;
    }

    for (const block of item.content) {
      if (block.type === "output_text" && block.text?.trim()) {
        textParts.push(block.text.trim());
      }
    }
  }

  return textParts.join("\n\n").trim();
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const adminId = verifyAdminToken(req.headers.get("Authorization"));
  if (!adminId) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: jsonHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  const xaiApiKey = process.env.XAI_API_KEY;
  if (!xaiApiKey) {
    console.error("recommend-market-events: XAI_API_KEY is not configured");
    return new Response(JSON.stringify({ error: "Event suggestions are not configured" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  try {
    const { marketQuestion, knownDates }: RecommendEventsRequest = await req.json();

    if (!marketQuestion?.trim()) {
      return new Response(JSON.stringify({ error: "Missing required field: marketQuestion" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    if (!Array.isArray(knownDates)) {
      return new Response(JSON.stringify({ error: "knownDates must be an array" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const currentDate = new Date().toISOString().slice(0, 10);
    const prompt = buildRecommendEventsPrompt(
      marketQuestion.trim(),
      formatKnownDatesForPrompt(knownDates),
      currentDate,
    );

    const response = await fetch(XAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${xaiApiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.3",
        input: [{ role: "user", content: prompt }],
        tools: [{ type: "web_search" }, { type: "x_search" }],
        text: {
          format: {
            type: "json_schema",
            name: "market_event_suggestions",
            schema: MARKET_EVENT_SUGGESTIONS_SCHEMA,
            strict: true,
          },
        },
        temperature: 0.2,
        max_output_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("recommend-market-events xAI error:", response.status, errorBody.slice(0, 500));
      return new Response(JSON.stringify({ error: "Failed to fetch event suggestions" }), {
        status: 502,
        headers: jsonHeaders,
      });
    }

    const data = (await response.json()) as XaiResponsesResponse;
    const content = extractXaiResponseText(data);
    const suggestions = parseRecommendEventsContent(content);

    return new Response(JSON.stringify({ content, suggestions }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (error) {
    console.error("recommend-market-events error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};

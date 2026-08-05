import { describeAiFailure } from "./failure";

type StructuredRequest = {
  system: string;
  prompt: string;
  schemaName: string;
  schema: Record<string, unknown>;
};

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first === -1 || last <= first) throw new Error("The AI provider did not return valid JSON.");
  return trimmed.slice(first, last + 1);
}

async function callOpenAI(request: StructuredRequest, apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5",
      store: false,
      input: [
        { role: "system", content: [{ type: "input_text", text: request.system }] },
        { role: "user", content: [{ type: "input_text", text: request.prompt }] },
      ],
      text: {
        format: {
          type: "json_schema",
          name: request.schemaName,
          strict: true,
          schema: request.schema,
        },
      },
    }),
    signal: AbortSignal.timeout(90_000),
  });

  const result = await response.json() as {
    error?: { message?: string };
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  if (!response.ok) throw new Error(result.error?.message ?? "OpenAI request failed.");

  const text = result.output
    ?.flatMap((item) => item.content ?? [])
    .find((item) => item.type === "output_text")
    ?.text;
  if (!text) throw new Error("OpenAI returned no structured output.");
  return JSON.parse(extractJson(text)) as unknown;
}

async function callAnthropic(request: StructuredRequest, apiKey: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 7000,
      temperature: 0,
      system: `${request.system}\nReturn only one JSON object matching this JSON Schema:\n${JSON.stringify(request.schema)}`,
      messages: [{ role: "user", content: request.prompt }],
    }),
    signal: AbortSignal.timeout(90_000),
  });

  const result = await response.json() as {
    error?: { message?: string };
    content?: Array<{ type?: string; text?: string }>;
  };
  if (!response.ok) throw new Error(result.error?.message ?? "Anthropic request failed.");
  const text = result.content?.find((item) => item.type === "text")?.text;
  if (!text) throw new Error("Anthropic returned no structured output.");
  return JSON.parse(extractJson(text)) as unknown;
}

/*
 * Two providers, tried in order — not one provider and a spare that never gets
 * used.
 *
 * This previously picked Anthropic only when OPENAI_API_KEY was *absent*, which
 * is the one case that almost never happens. The case that does happen is a key
 * that is present and an account behind it that has run out of credit: every
 * import then failed at the model call with a billing error, while a perfectly
 * good second key sat in the environment untouched. A configured provider that
 * cannot be reached is not a configured provider, so a failure moves on to the
 * next one and only the last failure is reported.
 */
export async function generateStructuredJson(request: StructuredRequest) {
  const openAIKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const providers: Array<() => Promise<unknown>> = [];
  if (openAIKey) providers.push(() => callOpenAI(request, openAIKey));
  if (anthropicKey) providers.push(() => callAnthropic(request, anthropicKey));

  if (!providers.length) {
    throw new Error("No server-side AI provider is configured. Add OPENAI_API_KEY or ANTHROPIC_API_KEY in Vercel.");
  }

  let last: unknown;
  for (const attempt of providers) {
    try {
      return await attempt();
    } catch (caught) {
      last = caught;
    }
  }

  const message = last instanceof Error ? last.message : "The AI provider failed.";
  throw new Error(describeAiFailure(message));
}

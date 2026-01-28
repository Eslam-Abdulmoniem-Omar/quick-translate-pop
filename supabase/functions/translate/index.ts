import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  ar: "Arabic",
  hi: "Hindi",
  tr: "Turkish",
  pl: "Polish",
  nl: "Dutch",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
  fi: "Finnish",
  el: "Greek",
};

function extractTokensFromSSE(sseText: string): number {
  let tokens = 0;
  const lines = sseText.split("\n");
  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    const data = line.slice(6).trim();
    if (!data || data === "[DONE]") continue;
    try {
      const payload = JSON.parse(data);
      if (payload?.usage?.total_tokens) {
        tokens = payload.usage.total_tokens;
      }
    } catch {
      // Ignore JSON parse errors for non-usage chunks
    }
  }
  return tokens;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, context, sourceLanguage, targetLanguage } = await req.json();

    if (!text) {
      throw new Error("No text provided for translation");
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const sourceLangName = LANGUAGE_NAMES[sourceLanguage] || sourceLanguage;
    const targetLangName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

    console.log(`Translating from ${sourceLangName} to ${targetLangName}:`, text);

    const systemPrompt = `You are an expert translator. Return natural, context-aware translations or meanings.

Rules:
1) If asked about meaning, explain it (don’t translate the question).
2) Use native-sounding language; adapt idioms; keep tone.

Return JSON ONLY:
{"originalPhrase":"","translation":"","explanation":"","examples":[],"notes":""}

translation = brief meaning only.
explanation = ONE sentence (usage/context only).`;

    const userPrompt = context
      ? `The user said (in ${sourceLangName}): "${text}"\nContext: "${context}"\n\nProvide the response in ${targetLangName}.`
      : `The user said (in ${sourceLangName}): "${text}"\n\nProvide the response in ${targetLangName}. If they are asking about the meaning of a word or phrase, explain it. If they want a translation, translate naturally.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Faster/cheaper model for V1
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        stream: true,
        stream_options: { include_usage: true },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body from AI");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let sseBuffer = "";

    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();

          extractTokensFromSSE(sseBuffer);
          return;
        }

        sseBuffer += decoder.decode(value, { stream: true });
        controller.enqueue(value);
      },
      cancel() {
        reader.cancel();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Translation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

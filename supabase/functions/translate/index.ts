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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, context, sourceLanguage, targetLanguage } = await req.json();

    if (!text) {
      throw new Error("No text provided for translation");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const sourceLangName = LANGUAGE_NAMES[sourceLanguage] || sourceLanguage;
    const targetLangName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

    console.log(`Translating from ${sourceLangName} to ${targetLangName}:`, text);

    const systemPrompt = `You are an expert translator and English language specialist. Your goal is to provide natural, context-aware translations or definitions, focusing on MEANING rather than literal words.

CRITICAL RULES:
1. If the user asks "What does [word/phrase] mean?" or similar, respond with the meaning of that word/phrase ONLY, not the whole sentence.
2. NEVER translate word-for-word; focus on natural, fluent language.
3. Adapt idioms, expressions, and cultural references appropriately.
4. Consider context, tone, and style—match what a native speaker would naturally say.
5. Remove filler words, hesitations, or redundant phrases from the source text.
6. If the source is conversational, make the output conversational too; if formal, keep it formal.

EXAMPLES:
User: "What does pivot mean in business?"
Bad (literal translation): "ماذا يعني المحور في الأعمال؟"
Good (natural, focused on meaning): "ما معنى مصطلح البيفوت في عالم الأعمال؟"

User: "Translate: I think, um, this is fine."
Bad: "أعتقد، مم، هذا جيد."
Good: "أعتقد أن هذا جيد." (cleaned, natural translation)

Always respond in this JSON format:
{
  "translation": "the natural, native-sounding translation or meaning of the requested word/phrase",
  "pronunciation": "a phonetic guide readable by a speaker of the source language",
  "examples": ["example sentence 1", "example sentence 2"],
  "notes": "brief cultural or usage notes if relevant"
}`;

    const userPrompt = context
      ? `Translate the following ${sourceLangName} text to ${targetLangName} in the context of "${context}":\n\n"${text}"`
      : `Translate the following ${sourceLangName} text to ${targetLangName}:\n\n"${text}"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    let translationData;
    try {
      translationData = JSON.parse(content);
    } catch {
      // Fallback if JSON parsing fails
      translationData = {
        translation: content,
        pronunciation: "",
        examples: [],
        notes: "",
      };
    }

    console.log("Translation result:", translationData.translation);

    return new Response(JSON.stringify(translationData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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

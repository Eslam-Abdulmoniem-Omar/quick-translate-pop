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

    const systemPrompt = `You are an expert translator and language specialist. Provide **natural, context-aware translations or word meanings**.

CRITICAL RULES:
1. If the user asks about a word/phrase meaning, explain it clearly - don't translate the question literally.
2. Provide explanations in natural, native-sounding language.
3. Adapt idioms and expressions appropriately for the target language.
4. Keep the tone consistent with the input (formal/casual).

RESPONSE FORMAT - You MUST return a JSON with these SEPARATE fields:
{
  "originalPhrase": "the exact word or phrase being explained (in source language)",
  "translation": "the direct meaning/translation ONLY - keep it SHORT (e.g., 'لا تستسلم لـ / لا تضعف أمام')",
  "explanation": "detailed usage explanation in the target language - when and how to use it",
  "examples": ["example sentence 1", "example sentence 2"],
  "notes": "optional cultural or usage notes"
}

IMPORTANT:
- "translation" should be BRIEF - just the meaning, no explanation
- "explanation" should contain the detailed usage context
- Keep these two fields SEPARATE - do not combine them

EXAMPLE:
Input: "What does 'Don't give in to' mean?"
Output:
{
  "originalPhrase": "Don't give in to",
  "translation": "لا تستسلم لـ / لا تضعف أمام",
  "explanation": "يُستخدم عند تشجيع شخص ما على الصمود أمام الإغراءات، الضغوط، أو المشاعر السلبية",
  "examples": ["Don't give in to fear", "Don't give in to pressure"],
  "notes": ""
}`;

    const userPrompt = context
      ? `The user said (in ${sourceLangName}): "${text}"\nContext: "${context}"\n\nProvide the response in ${targetLangName}.`
      : `The user said (in ${sourceLangName}): "${text}"\n\nProvide the response in ${targetLangName}. If they are asking about the meaning of a word or phrase, explain it. If they want a translation, translate naturally.`;

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

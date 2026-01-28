import { useState } from 'react';
import { toast } from 'sonner';

export interface TranslationResult {
  translation: string;
  explanation?: string;
  originalPhrase?: string;
  examples: string[];
  notes?: string;
}

interface UseTranslationOptions {
  sourceLanguage: string;
  targetLanguage: string;
}

const extractJsonStringValue = (jsonLike: string, key: string): string | undefined => {
  const keyIndex = jsonLike.indexOf(`"${key}"`);
  if (keyIndex === -1) return undefined;
  const colonIndex = jsonLike.indexOf(':', keyIndex);
  if (colonIndex === -1) return undefined;
  let i = jsonLike.indexOf('"', colonIndex);
  if (i === -1) return undefined;
  i += 1;
  let result = '';
  let escaping = false;
  for (; i < jsonLike.length; i += 1) {
    const ch = jsonLike[i];
    if (escaping) {
      if (ch === 'n') result += '\n';
      else if (ch === 't') result += '\t';
      else if (ch === 'r') result += '\r';
      else result += ch;
      escaping = false;
      continue;
    }
    if (ch === '\\') {
      escaping = true;
      continue;
    }
    if (ch === '"') {
      return result;
    }
    result += ch;
  }
  return result;
};

const toOneSentence = (text: string): string => {
  const trimmed = (text || '').trim();
  if (!trimmed) return '';
  const match = trimmed.match(/[.!?؟]/);
  if (!match || match.index === undefined) return trimmed;
  return trimmed.slice(0, match.index + 1).trim();
};

export function useTranslation({ sourceLanguage, targetLanguage }: UseTranslationOptions) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);

  const translate = async (
    text: string,
    context?: string,
    onPartial?: (partial: TranslationResult) => void
  ): Promise<TranslationResult | null> => {
    if (!text.trim()) {
      toast.error('Please provide text to translate');
      return null;
    }

    setIsTranslating(true);
    setResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            text,
            context,
            sourceLanguage,
            targetLanguage,
          }),
        }
      );

      if (response.status === 429) {
        toast.error('Rate limit exceeded. Please try again later.');
        return null;
      }

      if (response.status === 402) {
        toast.error('Usage limit reached. Please add credits.');
        return null;
      }

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream')) {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body for streaming');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let content = '';
        const partialState: TranslationResult = {
          translation: '',
          originalPhrase: '',
          examples: [],
        };
        let lastSent = {
          translation: '',
          originalPhrase: '',
        };
        let lastEmitAt = 0;
        const EMIT_INTERVAL_MS = 80;

        const emitPartial = () => {
          const translation = extractJsonStringValue(content, 'translation');
          const originalPhrase = extractJsonStringValue(content, 'originalPhrase');
          if (translation !== undefined) partialState.translation = translation;
          if (originalPhrase !== undefined) partialState.originalPhrase = originalPhrase;
          if (!onPartial) return;
          if (!partialState.translation && !partialState.originalPhrase) return;
          const now = Date.now();
          const changed =
            partialState.translation !== lastSent.translation ||
            partialState.originalPhrase !== lastSent.originalPhrase;
          if (changed && (now - lastEmitAt >= EMIT_INTERVAL_MS)) {
            lastEmitAt = now;
            lastSent = {
              translation: partialState.translation,
              originalPhrase: partialState.originalPhrase,
            };
            onPartial({ ...partialState });
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          // Yield to event loop every chunk to keep UI responsive
          await new Promise(resolve => queueMicrotask(resolve));
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.replace(/^data:\s*/, '');
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed?.choices?.[0]?.delta?.content;
              if (delta) {
                content += delta;
                emitPartial();
              }
            } catch {
              // Ignore malformed chunks
            }
          }
        }

        try {
          const finalData = JSON.parse(content);
          if (finalData.error) throw new Error(finalData.error);
          const translationResult: TranslationResult = {
            translation: finalData.translation || '',
            originalPhrase: finalData.originalPhrase || '',
            examples: finalData.examples || [],
          };
          if (onPartial) {
            onPartial({ ...translationResult });
          }
          setResult(translationResult);
          if (typeof performance !== 'undefined') {
            try {
              performance.mark('translation-done');
              console.log('[Perf] mark: translation-done');
            } catch {
              // Ignore performance errors
            }
          }
          return translationResult;
        } catch (parseError) {
          console.error('Streaming parse error:', parseError);
          const fallbackResult: TranslationResult = {
            translation: partialState.translation || '',
            originalPhrase: partialState.originalPhrase || '',
            examples: [],
          };
          if (fallbackResult.translation) {
            setResult(fallbackResult);
            if (typeof performance !== 'undefined') {
              try {
                performance.mark('translation-done');
                console.log('[Perf] mark: translation-done');
              } catch {
                // Ignore performance errors
              }
            }
            return fallbackResult;
          }
          throw parseError;
        }
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const translationResult: TranslationResult = {
        translation: data.translation || '',
        originalPhrase: data.originalPhrase || '',
        examples: data.examples || [],
      };

      setResult(translationResult);
      if (typeof performance !== 'undefined') {
        try {
          performance.mark('translation-done');
          console.log('[Perf] mark: translation-done');
        } catch {
          // Ignore performance errors
        }
      }
      return translationResult;
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate. Please try again.');
      return null;
    } finally {
      setIsTranslating(false);
    }
  };

  const clearResult = () => setResult(null);

  return {
    translate,
    isTranslating,
    result,
    clearResult,
  };
}

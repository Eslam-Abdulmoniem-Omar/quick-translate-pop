import { useState } from 'react';
import { toast } from 'sonner';

export interface TranslationResult {
  translation: string;
  pronunciation: string;
  examples: string[];
  notes?: string;
}

interface UseTranslationOptions {
  sourceLanguage: string;
  targetLanguage: string;
}

export function useTranslation({ sourceLanguage, targetLanguage }: UseTranslationOptions) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);

  const translate = async (text: string, context?: string): Promise<TranslationResult | null> => {
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
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const translationResult: TranslationResult = {
        translation: data.translation || '',
        pronunciation: data.pronunciation || '',
        examples: data.examples || [],
        notes: data.notes,
      };

      setResult(translationResult);
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

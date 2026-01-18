import { X, BookmarkPlus, Volume2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLanguageName, getLanguageFlag } from '@/lib/languages';
import { TranslationResult } from '@/hooks/useTranslation';
import { toast } from 'sonner';

interface TranslationPopupProps {
  originalText: string;
  context?: string;
  result: TranslationResult;
  sourceLanguage: string;
  targetLanguage: string;
  onClose: () => void;
  onSaveFlashcard: () => void;
  isAuthenticated: boolean;
}

export function TranslationPopup({
  originalText,
  context,
  result,
  sourceLanguage,
  targetLanguage,
  onClose,
  onSaveFlashcard,
  isAuthenticated,
}: TranslationPopupProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.translation);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-lg glass-effect border-border/50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-start justify-between pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {getLanguageFlag(sourceLanguage)} {getLanguageName(sourceLanguage)}
            </Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="secondary" className="font-normal">
              {getLanguageFlag(targetLanguage)} {getLanguageName(targetLanguage)}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Original text */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Original</p>
            <p className="text-foreground">{originalText}</p>
            {context && (
              <p className="text-xs text-muted-foreground italic">
                Context: {context}
              </p>
            )}
          </div>

          {/* Translation */}
          <div className="space-y-2 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-lg font-medium text-foreground">{result.translation}</p>
            {result.pronunciation && (
              <p className="text-sm text-muted-foreground font-mono">
                /{result.pronunciation}/
              </p>
            )}
          </div>

          {/* Examples */}
          {result.examples && result.examples.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Examples</p>
              <ul className="space-y-1.5">
                {result.examples.map((example, i) => (
                  <li key={i} className="text-sm text-foreground/80 pl-3 border-l-2 border-primary/30">
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {result.notes && (
            <div className="p-3 rounded-lg bg-secondary/50 text-sm text-muted-foreground">
              💡 {result.notes}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex-1"
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            
            {isAuthenticated && (
              <Button
                variant="default"
                size="sm"
                onClick={onSaveFlashcard}
                className="flex-1"
              >
                <BookmarkPlus className="h-4 w-4 mr-2" />
                Save to Flashcards
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

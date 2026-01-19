import { useState, useEffect } from 'react';
import { X, Copy, Check, Maximize2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLanguageFlag } from '@/lib/languages';
import { TranslationResult } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TranslationToastProps {
  originalText: string;
  context?: string;
  result: TranslationResult;
  sourceLanguage: string;
  targetLanguage: string;
  onClose: () => void;
  autoDismiss?: number; // milliseconds, 0 to disable
}

export function TranslationToast({
  originalText,
  context,
  result,
  sourceLanguage,
  targetLanguage,
  onClose,
  autoDismiss = 8000,
}: TranslationToastProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  useEffect(() => {
    if (autoDismiss > 0 && !expanded) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onClose, expanded]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.translation);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={cn(
        'fixed bottom-24 right-4 z-50 w-full max-w-sm',
        'transition-all duration-300 ease-out',
        isVisible 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-4 opacity-0'
      )}
    >
      <div className="glass-effect rounded-xl border border-border/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2 text-sm">
            <span>{getLanguageFlag(sourceLanguage)}</span>
            <span className="text-muted-foreground">→</span>
            <span>{getLanguageFlag(targetLanguage)}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Original text - compact */}
          <p className="text-sm text-muted-foreground line-clamp-1">
            "{originalText}"
          </p>

          {/* Translation */}
          <div className="space-y-1">
            <p className="text-lg font-medium text-foreground">
              {result.translation}
            </p>
            {result.pronunciation && (
              <p className="text-sm text-muted-foreground font-mono">
                /{result.pronunciation}/
              </p>
            )}
          </div>

          {/* Expanded content */}
          {expanded && (
            <div className="space-y-3 pt-2 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
              {context && (
                <p className="text-xs text-muted-foreground italic">
                  Context: {context}
                </p>
              )}

              {result.examples && result.examples.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Examples
                  </p>
                  <ul className="space-y-1">
                    {result.examples.map((example, i) => (
                      <li
                        key={i}
                        className="text-sm text-foreground/80 pl-3 border-l-2 border-primary/30"
                      >
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.notes && (
                <div className="p-2.5 rounded-lg bg-secondary/50 text-sm text-muted-foreground">
                  💡 {result.notes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border/50 bg-secondary/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="flex-1 h-8"
          >
            {copied ? (
              <Check className="h-4 w-4 mr-1.5" />
            ) : (
              <Copy className="h-4 w-4 mr-1.5" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="flex-1 h-8"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4 mr-1.5" />
            ) : (
              <ChevronDown className="h-4 w-4 mr-1.5" />
            )}
            {expanded ? 'Less' : 'More'}
          </Button>
        </div>
      </div>
    </div>
  );
}

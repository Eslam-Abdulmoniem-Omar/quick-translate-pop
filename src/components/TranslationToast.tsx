import { useState, useEffect, useRef } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  autoDismiss?: number;
}

export function TranslationToast({
  result,
  onClose,
  autoDismiss = 10000,
}: TranslationToastProps) {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  useEffect(() => {
    if (autoDismiss > 0 && !isPaused) {
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 200);
      }, autoDismiss);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [autoDismiss, onClose, isPaused]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.translation);
    setCopied(true);
    toast.success('Copied');
    setTimeout(() => setCopied(false), 1500);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={cn(
        'fixed bottom-6 right-4 z-50 max-w-xs',
        'transition-all duration-200 ease-out',
        isVisible 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-2 opacity-0'
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="glass-effect rounded-lg border border-border/30 shadow-lg p-3">
        {/* Translation */}
        <div className="pr-6">
          <p className="text-base font-medium text-foreground leading-snug">
            {result.translation}
          </p>
          {result.pronunciation && (
            <p className="text-xs text-muted-foreground font-mono mt-1">
              /{result.pronunciation}/
            </p>
          )}
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </Button>

        {/* Copy button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="mt-2 h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

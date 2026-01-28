import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TranslationResult } from '@/hooks/useTranslation';
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
  autoDismiss = 5000,
}: TranslationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      window.electron?.setOverlayInteractive?.(false);
    };
  }, []);

  useEffect(() => {
    // Only start auto-dismiss timer when translation has actual content
    const hasContent = result.translation && result.translation.trim().length > 0;
    
    if (autoDismiss > 0 && !isPaused && hasContent) {
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 200);
      }, autoDismiss);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [autoDismiss, onClose, isPaused, result.translation]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    window.electron?.setOverlayInteractive?.(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    window.electron?.setOverlayInteractive?.(false);
  };

  const handleClose = () => {
    window.electron?.setOverlayInteractive?.(false);
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={cn(
        'fixed bottom-24 right-4 z-[9999]',
        'transition-all duration-300 ease-out pointer-events-none',
        isVisible
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-4 opacity-0 scale-95'
      )}
    >
      <div
        className={cn(
          'pointer-events-auto',
          'bg-white rounded-xl',
          'border border-[#DADCE0]',
          'shadow-[0_4px_12px_rgba(0,0,0,0.15)]',
          'overflow-hidden',
          'max-w-[460px] w-[90vw]'
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Content Section */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {/* Header with original text */}
          {result.originalPhrase && (
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#5F6368] mb-1">Original</p>
                <p className="text-sm text-[#202124] leading-snug whitespace-pre-wrap break-words">
                  "{result.originalPhrase}"
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-7 w-7 rounded-full hover:bg-[#F1F3F4] text-[#5F6368] hover:text-[#202124] shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {!result.originalPhrase && (
            <div className="flex justify-end -mt-1 -mr-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-7 w-7 rounded-full hover:bg-[#F1F3F4] text-[#5F6368] hover:text-[#202124]"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Translation */}
          <div dir="rtl" className="text-right">
            <p className="text-lg font-semibold text-[#202124] leading-relaxed whitespace-pre-wrap break-words">
              {result.translation || (
                <span className="text-[#5F6368] animate-pulse">Translation...</span>
              )}
            </p>
          </div>
        </div>

        {/* Accent divider */}
        <div className="h-0.5 bg-[#1A73E8]" />
      </div>
    </div>
  );
}

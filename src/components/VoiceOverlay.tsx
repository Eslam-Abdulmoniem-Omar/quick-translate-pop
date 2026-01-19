import { useState, useCallback, useEffect } from 'react';
import { AudioWaveform } from '@/components/AudioWaveform';
import { TranslationToast } from '@/components/TranslationToast';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useTranslation, TranslationResult } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface VoiceOverlayProps {
  sourceLanguage: string;
  targetLanguage: string;
}

export function VoiceOverlay({ sourceLanguage, targetLanguage }: VoiceOverlayProps) {
  const [showToast, setShowToast] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState<{
    text: string;
    context?: string;
    result: TranslationResult;
  } | null>(null);

  const { translate, isTranslating } = useTranslation({ sourceLanguage, targetLanguage });

  const handleTranslation = useCallback(async (text: string, context?: string) => {
    const result = await translate(text, context);
    if (result) {
      setCurrentTranslation({ text, context, result });
      setShowToast(true);
    }
  }, [translate]);

  const { isRecording, isProcessing, isInitializing, startRecording, stopRecording } = useVoiceInput({
    onTranscription: (text) => {
      handleTranslation(text);
    },
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'q' && e.altKey && !e.repeat) {
        e.preventDefault();
        if (!isRecording && !isProcessing && !isTranslating && !isInitializing) {
          startRecording();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'q' || e.key === 'Alt') {
        if (isRecording) {
          stopRecording();
        }
      }
    };

    const handleBlur = () => {
      if (isRecording) {
        stopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isRecording, isProcessing, isTranslating, isInitializing, startRecording, stopRecording]);

  const isActive = isRecording || isProcessing || isTranslating || isInitializing;
  const statusText = isInitializing
    ? 'Starting...'
    : isRecording 
      ? 'Listening...' 
      : isProcessing 
        ? 'Processing...' 
        : isTranslating 
          ? 'Translating...' 
          : null;

  return (
    <>
      {/* Bottom-center pill bar - Wispr Flow style */}
      <div 
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
          'transition-all duration-100 ease-out',
          isActive 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-4 opacity-0 pointer-events-none'
        )}
      >
        <div className={cn(
          'glass-effect rounded-full px-5 py-3',
          'border border-border/30 shadow-lg',
          'flex items-center gap-3'
        )}>
          {isRecording ? (
            <>
              <AudioWaveform 
                isActive={true} 
                barCount={8}
                className="h-5 w-20"
              />
              <span className="text-sm font-medium text-foreground/80 whitespace-nowrap">
                {statusText}
              </span>
            </>
          ) : (
            <>
              {/* Compact processing spinner */}
              <div className="relative flex items-center justify-center w-5 h-5">
                <div className="absolute inset-0 animate-spin-slow">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1.5 h-1.5 bg-primary rounded-full"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${i * 120}deg) translateY(-8px) translateX(-50%)`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <span className="text-sm font-medium text-foreground/80 whitespace-nowrap">
                {statusText}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Translation Toast - Independent of recording state */}
      {showToast && currentTranslation && (
        <TranslationToast
          originalText={currentTranslation.text}
          context={currentTranslation.context}
          result={currentTranslation.result}
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}

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
  const [isVisible, setIsVisible] = useState(false);
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
    setTimeout(() => setIsVisible(false), 150);
  }, [translate]);

  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceInput({
    onTranscription: (text) => {
      handleTranslation(text);
    },
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'q' && e.altKey && !e.repeat) {
        e.preventDefault();
        if (!isRecording && !isProcessing && !isTranslating) {
          setIsVisible(true);
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
  }, [isRecording, isProcessing, isTranslating, startRecording, stopRecording]);

  const isActive = isRecording || isProcessing || isTranslating;
  const statusText = isRecording 
    ? 'Listening...' 
    : isProcessing 
      ? 'Processing...' 
      : isTranslating 
        ? 'Translating...' 
        : null;

  if (!isVisible && !isActive) return null;

  return (
    <>
      {/* Subtle backdrop */}
      <div 
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          'bg-background/60 backdrop-blur-md',
          'animate-fade-in'
        )}
      >
        {/* Minimal glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[300px] h-[300px] rounded-full',
            'bg-primary/10 blur-3xl',
            isRecording && 'animate-breathe'
          )} />
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          {isRecording ? (
            <>
              <AudioWaveform 
                isActive={true} 
                barCount={12}
                className="h-16 w-48"
              />
              <p className="text-lg font-medium text-foreground/80">
                {statusText}
              </p>
            </>
          ) : (
            <>
              {/* Processing spinner */}
              <div className="relative flex items-center justify-center w-20 h-20">
                <div className="absolute inset-0 animate-spin-slow">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-primary rounded-full"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${i * 120}deg) translateY(-28px) translateX(-50%)`,
                      }}
                    />
                  ))}
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/20 animate-pulse" />
              </div>
              <p className="text-lg font-medium text-foreground/80">
                {statusText}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Translation Toast */}
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

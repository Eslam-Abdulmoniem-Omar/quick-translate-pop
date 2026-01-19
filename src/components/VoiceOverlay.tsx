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

  const { isRecording, isProcessing, isInitializing, isTooShort, activeStream, startRecording, stopRecording } = useVoiceInput({
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

  const isActive = isRecording || isProcessing || isTranslating || isInitializing || isTooShort;
  const isIdle = !isActive;
  
  const statusText = isTooShort
    ? 'Too short'
    : isInitializing
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
      {/* Bottom-center pill bar - Always visible */}
      <div 
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
          'transition-all duration-200 ease-out'
        )}
      >
        <div className={cn(
          'glass-effect rounded-full shadow-lg',
          'border border-border/30',
          'flex items-center justify-center',
          'transition-all duration-200 ease-out',
          // Dynamic sizing based on state
          isIdle 
            ? 'w-10 h-10' 
            : 'px-5 py-3 min-w-[140px]'
        )}>
          {isIdle ? (
            // Idle state: single static dot
            <div className="w-2 h-2 bg-foreground/50 rounded-full" />
          ) : isRecording ? (
            // Recording state: animated waveform with real audio data
            <div className="flex items-center gap-3">
              <AudioWaveform 
                isActive={true}
                stream={activeStream}
                barCount={8}
                className="h-5 w-20"
              />
              <span className="text-sm font-medium text-foreground/80 whitespace-nowrap">
                {statusText}
              </span>
            </div>
          ) : (
            // Processing/translating states: spinner
            <div className="flex items-center gap-3">
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
            </div>
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

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
      // Use e.code for physical key position - works regardless of keyboard layout
      if (e.code === 'KeyT' && e.altKey && !e.repeat) {
        e.preventDefault();
        if (!isRecording && !isProcessing && !isTranslating && !isInitializing) {
          startRecording();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Check physical key code or Alt release to stop recording
      if (e.code === 'KeyT' || e.key === 'Alt') {
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

  // Handle auto-hide after translation toast closes
  const handleToastClose = useCallback(() => {
    setShowToast(false);
    setCurrentTranslation(null);
  }, []);

  const isActive = isRecording || isProcessing || isTranslating || isInitializing || isTooShort;
  const isIdle = !isActive && !showToast;
  
  return (
    <>
      {/* Bottom-center pill bar - Completely invisible when idle */}
      <div 
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
          'transition-all duration-200 ease-out',
          // Completely invisible when idle - no buttons, no dots
          isIdle && !isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
      >
        {isActive && (
          <div className={cn(
            'glass-effect rounded-full shadow-lg',
            'border border-border/30',
            'flex items-center justify-center',
            'transition-all duration-200 ease-out',
            'w-12 h-9'
          )}>
            {isRecording ? (
              // Recording state: animated waveform only
              <AudioWaveform 
                isActive={true}
                stream={activeStream}
                barCount={5}
                className="h-4 w-[22px]"
              />
            ) : (
              // Processing/translating states: spinner only
              <div className="relative flex items-center justify-center w-4 h-4">
                <div className="absolute inset-0 animate-spin-slow">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-primary rounded-full"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${i * 120}deg) translateY(-6px) translateX(-50%)`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Translation Toast - Independent of recording state */}
      {showToast && currentTranslation && (
        <TranslationToast
          originalText={currentTranslation.text}
          context={currentTranslation.context}
          result={currentTranslation.result}
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          onClose={handleToastClose}
        />
      )}
    </>
  );
}

import { useState, useCallback } from 'react';
import { Mic, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { AudioWaveform } from '@/components/AudioWaveform';
import { TranslationToast } from '@/components/TranslationToast';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useTranslation, TranslationResult } from '@/hooks/useTranslation';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { cn } from '@/lib/utils';

export function FloatingDock() {
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [showToast, setShowToast] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState<{
    text: string;
    context?: string;
    result: TranslationResult;
  } | null>(null);

  const { translate, isTranslating } = useTranslation({ sourceLanguage, targetLanguage });

  const handleTranslation = useCallback(async (text: string, context?: string) => {
    let hasShown = false;
    const handlePartial = (partial: TranslationResult) => {
      if (!hasShown) {
        setShowToast(true);
        hasShown = true;
      }
      setCurrentTranslation({ text, context, result: partial });
    };

    const result = await translate(text, context, handlePartial);
    if (result) {
      setCurrentTranslation({ text, context, result });
      setShowToast(true);
    }
  }, [translate]);

  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceInput({
    onTranscription: (text) => {
      handleTranslation(text);
    },
  });

  const handleVoiceClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Alt+T shortcut for voice input
  useKeyboardShortcut(
    { code: 'KeyT', altKey: true },
    handleVoiceClick,
    !isProcessing && !isTranslating
  );

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
  };

  const isActive = isRecording || isProcessing || isTranslating;
  const statusText = isRecording 
    ? 'Listening...' 
    : isProcessing 
      ? 'Processing...' 
      : isTranslating 
        ? 'Translating...' 
        : null;

  return (
    <>
      {/* Floating Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div
          className={cn(
            'glass-effect rounded-2xl border border-border/50 shadow-2xl',
            'transition-all duration-300 ease-out',
            isActive 
              ? 'px-6 py-4 min-w-[320px]' 
              : 'px-4 py-3'
          )}
        >
          {isActive ? (
            // Expanded recording state
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-4 w-full">
                <AudioWaveform 
                  isActive={isRecording} 
                  barCount={7}
                  className="h-10 flex-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground animate-pulse">
                  {statusText}
                </span>
                {isRecording && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={stopRecording}
                    className="h-8"
                  >
                    Stop
                  </Button>
                )}
              </div>
            </div>
          ) : (
            // Compact idle state
            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <LanguageSwitcher
                sourceLanguage={sourceLanguage}
                targetLanguage={targetLanguage}
                onSourceChange={setSourceLanguage}
                onTargetChange={setTargetLanguage}
                onSwap={swapLanguages}
              />

              {/* Divider */}
              <div className="w-px h-8 bg-border" />

              {/* Voice Button */}
              <Button
                variant="default"
                size="icon"
                onClick={handleVoiceClick}
                className={cn(
                  'h-10 w-10 rounded-full shadow-lg transition-all',
                  'bg-primary hover:bg-primary/90',
                  'shadow-primary/30 hover:shadow-primary/50'
                )}
              >
                <Mic className="h-5 w-5" />
              </Button>

              {/* Keyboard hint */}
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                <span className="kbd px-1.5 py-0.5 text-[10px]">Alt</span>
                <span>+</span>
                <span className="kbd px-1.5 py-0.5 text-[10px]">T</span>
              </div>
            </div>
          )}
        </div>

        {/* Glow effect when active */}
        {isActive && (
          <div className="absolute inset-0 -z-10 rounded-2xl bg-primary/20 blur-xl animate-pulse" />
        )}
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
          autoDismiss={0} // Disable auto-dismiss for now
        />
      )}
    </>
  );
}

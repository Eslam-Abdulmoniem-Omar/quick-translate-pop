import { useState, useCallback } from 'react';
import { ArrowLeftRight, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageSelector } from '@/components/LanguageSelector';
import { VoiceButton } from '@/components/VoiceButton';
import { TranslationPopup } from '@/components/TranslationPopup';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useTranslation, TranslationResult } from '@/hooks/useTranslation';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useFlashcards } from '@/hooks/useFlashcards';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function TranslatorInterface() {
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [textInput, setTextInput] = useState('');
  const [contextInput, setContextInput] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState<{
    text: string;
    context?: string;
    result: TranslationResult;
  } | null>(null);

  const { user } = useAuth();
  const { addFlashcard } = useFlashcards();
  const { translate, isTranslating } = useTranslation({ sourceLanguage, targetLanguage });

  const handleTranslation = useCallback(async (text: string, context?: string) => {
    const result = await translate(text, context);
    if (result) {
      setCurrentTranslation({ text, context, result });
      setShowPopup(true);
    }
  }, [translate]);

  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceInput({
    onTranscription: (text) => {
      setTextInput(text);
      handleTranslation(text, contextInput);
    },
  });

  const handleVoiceClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Alt+Q shortcut for voice input
  useKeyboardShortcut(
    { key: 'q', altKey: true },
    handleVoiceClick,
    !isProcessing && !isTranslating
  );

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleTranslation(textInput, contextInput);
    }
  };

  const handleSaveFlashcard = () => {
    if (!currentTranslation || !user) {
      toast.error('Please sign in to save flashcards');
      return;
    }

    addFlashcard.mutate({
      original_text: currentTranslation.text,
      translated_text: currentTranslation.result.translation,
      context: currentTranslation.context,
      source_language: sourceLanguage,
      target_language: targetLanguage,
    });

    setShowPopup(false);
  };

  return (
    <div className="space-y-8">
      {/* Language selectors */}
      <div className="flex items-end justify-center gap-4">
        <LanguageSelector
          value={sourceLanguage}
          onChange={setSourceLanguage}
          label="From"
        />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={swapLanguages}
          className="mb-0.5"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </Button>
        
        <LanguageSelector
          value={targetLanguage}
          onChange={setTargetLanguage}
          label="To"
        />
      </div>

      {/* Voice input */}
      <div className="flex flex-col items-center gap-4">
        <VoiceButton
          isRecording={isRecording}
          isProcessing={isProcessing || isTranslating}
          onClick={handleVoiceClick}
        />
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {isRecording 
              ? 'Listening... Click to stop' 
              : isProcessing 
                ? 'Processing...' 
                : isTranslating
                  ? 'Translating...'
                  : 'Click to speak or press'}
          </p>
          {!isRecording && !isProcessing && !isTranslating && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="kbd">Alt</span>
              <span className="text-muted-foreground">+</span>
              <span className="kbd">Q</span>
            </div>
          )}
        </div>
      </div>

      {/* Text input fallback */}
      <form onSubmit={handleTextSubmit} className="space-y-3">
        <div className="relative">
          <Input
            placeholder="Or type text to translate..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="pr-10"
          />
          <Keyboard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        
        <Input
          placeholder="Context (optional): e.g., 'in a business meeting'"
          value={contextInput}
          onChange={(e) => setContextInput(e.target.value)}
        />
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={!textInput.trim() || isTranslating}
        >
          Translate
        </Button>
      </form>

      {/* Translation popup */}
      {showPopup && currentTranslation && (
        <TranslationPopup
          originalText={currentTranslation.text}
          context={currentTranslation.context}
          result={currentTranslation.result}
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          onClose={() => setShowPopup(false)}
          onSaveFlashcard={handleSaveFlashcard}
          isAuthenticated={!!user}
        />
      )}
    </div>
  );
}

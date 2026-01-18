import { useState } from 'react';
import { RotateCcw, Check, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLanguageFlag } from '@/lib/languages';
import type { Flashcard } from '@/hooks/useFlashcards';
import { cn } from '@/lib/utils';

interface FlashcardReviewProps {
  card: Flashcard;
  onReview: (response: 'again' | 'hard' | 'good' | 'easy') => void;
  onSkip: () => void;
}

export function FlashcardReview({ card, onReview, onSkip }: FlashcardReviewProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => setIsFlipped(!isFlipped);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card */}
      <div 
        className="perspective-1000 cursor-pointer mb-6"
        onClick={handleFlip}
      >
        <div 
          className={cn(
            'relative w-full h-64 preserve-3d transition-transform duration-500',
            isFlipped && 'rotate-y-180'
          )}
        >
          {/* Front */}
          <Card className="absolute inset-0 backface-hidden">
            <CardContent className="flex flex-col items-center justify-center h-full p-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">
                  {getLanguageFlag(card.source_language)} Original
                </Badge>
              </div>
              <p className="text-xl font-medium text-center text-foreground">
                {card.original_text}
              </p>
              {card.context && (
                <p className="text-sm text-muted-foreground mt-3 text-center italic">
                  Context: {card.context}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                Tap to reveal translation
              </p>
            </CardContent>
          </Card>

          {/* Back */}
          <Card className="absolute inset-0 backface-hidden rotate-y-180">
            <CardContent className="flex flex-col items-center justify-center h-full p-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">
                  {getLanguageFlag(card.target_language)} Translation
                </Badge>
              </div>
              <p className="text-xl font-medium text-center text-foreground">
                {card.translated_text}
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Tap to see original
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review buttons - only show when flipped */}
      {isFlipped && (
        <div className="grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Button
            variant="outline"
            className="flex flex-col h-auto py-3 border-destructive/50 hover:bg-destructive/10"
            onClick={() => onReview('again')}
          >
            <X className="h-5 w-5 text-destructive mb-1" />
            <span className="text-xs">Again</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col h-auto py-3 border-orange-500/50 hover:bg-orange-500/10"
            onClick={() => onReview('hard')}
          >
            <RotateCcw className="h-5 w-5 text-orange-500 mb-1" />
            <span className="text-xs">Hard</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col h-auto py-3 border-green-500/50 hover:bg-green-500/10"
            onClick={() => onReview('good')}
          >
            <Check className="h-5 w-5 text-green-500 mb-1" />
            <span className="text-xs">Good</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col h-auto py-3 border-primary/50 hover:bg-primary/10"
            onClick={() => onReview('easy')}
          >
            <Zap className="h-5 w-5 text-primary mb-1" />
            <span className="text-xs">Easy</span>
          </Button>
        </div>
      )}

      {!isFlipped && (
        <Button variant="ghost" className="w-full" onClick={onSkip}>
          Skip this card
        </Button>
      )}
    </div>
  );
}

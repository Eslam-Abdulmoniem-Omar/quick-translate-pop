import { useState } from 'react';
import { BookOpen, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FlashcardReview } from '@/components/FlashcardReview';
import { useFlashcards, Flashcard } from '@/hooks/useFlashcards';
import { getLanguageFlag } from '@/lib/languages';
import { format } from 'date-fns';

export function FlashcardsView() {
  const { flashcards, dueCards, isLoading, reviewFlashcard, deleteFlashcard } = useFlashcards();
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const handleStartReview = () => {
    if (dueCards.length > 0) {
      setCurrentCardIndex(0);
      setIsReviewing(true);
    }
  };

  const handleReview = (response: 'again' | 'hard' | 'good' | 'easy') => {
    const card = dueCards[currentCardIndex];
    reviewFlashcard.mutate(
      { cardId: card.id, response },
      {
        onSuccess: () => {
          if (currentCardIndex < dueCards.length - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
          } else {
            setIsReviewing(false);
          }
        },
      }
    );
  };

  const handleSkip = () => {
    if (currentCardIndex < dueCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setIsReviewing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Review mode
  if (isReviewing && dueCards.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            Card {currentCardIndex + 1} of {dueCards.length}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setIsReviewing(false)}>
            Exit Review
          </Button>
        </div>
        
        <FlashcardReview
          card={dueCards[currentCardIndex]}
          onReview={handleReview}
          onSkip={handleSkip}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review prompt */}
      {dueCards.length > 0 && (
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {dueCards.length} card{dueCards.length !== 1 ? 's' : ''} due for review
                </p>
                <p className="text-sm text-muted-foreground">
                  Keep your learning streak going!
                </p>
              </div>
            </div>
            <Button onClick={handleStartReview}>
              <BookOpen className="h-4 w-4 mr-2" />
              Start Review
            </Button>
          </CardContent>
        </Card>
      )}

      {/* All flashcards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Flashcards ({flashcards.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {flashcards.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No flashcards yet. Save translations to build your collection!
            </p>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {flashcards.map((card) => (
                  <FlashcardItem
                    key={card.id}
                    card={card}
                    onDelete={() => deleteFlashcard.mutate(card.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FlashcardItem({ card, onDelete }: { card: Flashcard; onDelete: () => void }) {
  const nextReview = card.next_review_date 
    ? format(new Date(card.next_review_date), 'MMM d, yyyy')
    : 'Now';

  return (
    <div className="p-4 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {getLanguageFlag(card.source_language)} → {getLanguageFlag(card.target_language)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Next: {nextReview}
            </span>
          </div>
          <p className="font-medium text-foreground truncate">{card.original_text}</p>
          <p className="text-sm text-muted-foreground truncate">{card.translated_text}</p>
          {card.context && (
            <p className="text-xs text-muted-foreground/70 mt-1 italic truncate">
              {card.context}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

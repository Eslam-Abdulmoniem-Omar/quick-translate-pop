import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { calculateNextReview, qualityFromResponse, getDueCards } from '@/lib/spacedRepetition';

export interface Flashcard {
  id: string;
  user_id: string;
  original_text: string;
  translated_text: string;
  context: string | null;
  source_language: string;
  target_language: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useFlashcards() {
  const queryClient = useQueryClient();

  const { data: flashcards = [], isLoading } = useQuery({
    queryKey: ['flashcards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Flashcard[];
    },
  });

  const dueCards = getDueCards(flashcards);

  const addFlashcard = useMutation({
    mutationFn: async (card: {
      original_text: string;
      translated_text: string;
      context?: string;
      source_language: string;
      target_language: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('flashcards')
        .insert({
          user_id: user.id,
          original_text: card.original_text,
          translated_text: card.translated_text,
          context: card.context || null,
          source_language: card.source_language,
          target_language: card.target_language,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      toast.success('Flashcard saved!');
    },
    onError: (error) => {
      console.error('Error adding flashcard:', error);
      toast.error('Failed to save flashcard');
    },
  });

  const reviewFlashcard = useMutation({
    mutationFn: async ({ 
      cardId, 
      response 
    }: { 
      cardId: string; 
      response: 'again' | 'hard' | 'good' | 'easy';
    }) => {
      const card = flashcards.find(c => c.id === cardId);
      if (!card) throw new Error('Card not found');

      const quality = qualityFromResponse(response);
      const reviewData = calculateNextReview(
        quality,
        Number(card.ease_factor),
        card.interval_days,
        card.repetitions
      );

      const { data, error } = await supabase
        .from('flashcards')
        .update({
          ease_factor: reviewData.easeFactor,
          interval_days: reviewData.intervalDays,
          repetitions: reviewData.repetitions,
          next_review_date: reviewData.nextReviewDate.toISOString(),
          last_reviewed_at: new Date().toISOString(),
        })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
    onError: (error) => {
      console.error('Error reviewing flashcard:', error);
      toast.error('Failed to update flashcard');
    },
  });

  const deleteFlashcard = useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      toast.success('Flashcard deleted');
    },
    onError: (error) => {
      console.error('Error deleting flashcard:', error);
      toast.error('Failed to delete flashcard');
    },
  });

  return {
    flashcards,
    dueCards,
    isLoading,
    addFlashcard,
    reviewFlashcard,
    deleteFlashcard,
  };
}

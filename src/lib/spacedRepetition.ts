// SM-2 Spaced Repetition Algorithm
// Based on SuperMemo 2 algorithm

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface FlashcardReviewData {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: Date;
}

export function calculateNextReview(
  quality: ReviewQuality,
  currentEaseFactor: number,
  currentInterval: number,
  currentRepetitions: number
): FlashcardReviewData {
  // Quality meanings:
  // 0 - Complete blackout, no recollection
  // 1 - Incorrect, but upon seeing answer, remembered
  // 2 - Incorrect, but answer seemed easy to recall
  // 3 - Correct with serious difficulty
  // 4 - Correct with hesitation
  // 5 - Perfect response

  let easeFactor = currentEaseFactor;
  let intervalDays = currentInterval;
  let repetitions = currentRepetitions;

  if (quality < 3) {
    // Failed review - reset repetitions
    repetitions = 0;
    intervalDays = 1;
  } else {
    // Successful review
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(currentInterval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor (minimum 1.3)
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

  return {
    easeFactor,
    intervalDays,
    repetitions,
    nextReviewDate,
  };
}

export function qualityFromResponse(response: 'again' | 'hard' | 'good' | 'easy'): ReviewQuality {
  switch (response) {
    case 'again':
      return 0;
    case 'hard':
      return 3;
    case 'good':
      return 4;
    case 'easy':
      return 5;
  }
}

export function getDueCards<T extends { next_review_date: string | null }>(
  cards: T[]
): T[] {
  const now = new Date();
  return cards.filter(card => {
    if (!card.next_review_date) return true;
    return new Date(card.next_review_date) <= now;
  });
}

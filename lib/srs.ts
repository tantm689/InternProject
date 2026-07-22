export type SrsRating = "again" | "hard" | "good" | "easy";

export interface VocabProgressInput {
  easeFactor?: number;
  intervalDays?: number;
  repetitions?: number;
  nextReviewAt?: Date | null;
  lastReviewedAt?: Date | null;
  lastResult?: string | null;
  masteredAt?: Date | null;
}

export interface VocabProgressOutput {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: Date;
  lastReviewedAt: Date;
  lastResult: SrsRating;
  masteredAt: Date | null;
}

/**
 * Standard SuperMemo 2 (SM-2) Spaced Repetition Algorithm
 *
 * Ratings:
 * - "again": Quality q = 1 (Lập lại từ đầu)
 * - "hard":  Quality q = 3 (Khó)
 * - "good":  Quality q = 4 (Tốt)
 * - "easy":  Quality q = 5 (Dễ)
 */
export function updateVocabularyProgress(
  currentProgress: VocabProgressInput | null | undefined,
  rating: SrsRating
): VocabProgressOutput {
  const oldEaseFactor = currentProgress?.easeFactor ?? 2.5;
  const oldIntervalDays = currentProgress?.intervalDays ?? 0;
  const oldRepetitions = currentProgress?.repetitions ?? 0;
  const oldMasteredAt = currentProgress?.masteredAt ?? null;

  // Map rating to quality score q (0-5)
  let q: number;
  switch (rating) {
    case "again":
      q = 1;
      break;
    case "hard":
      q = 3;
      break;
    case "good":
      q = 4;
      break;
    case "easy":
      q = 5;
      break;
    default:
      q = 4;
  }

  // Calculate new Ease Factor (EF)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  let newEaseFactor =
    oldEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  let newRepetitions: number;
  let newIntervalDays: number;

  if (q < 3) {
    // Incorrect / Again response resets repetitions
    newRepetitions = 0;
    newIntervalDays = 1;
  } else {
    // Correct response increases repetitions
    newRepetitions = oldRepetitions + 1;
    if (newRepetitions === 1) {
      newIntervalDays = 1;
    } else if (newRepetitions === 2) {
      newIntervalDays = 6;
    } else {
      newIntervalDays = Math.round(oldIntervalDays * newEaseFactor);
    }
  }

  const now = new Date();
  const nextReviewAt = new Date(
    now.getTime() + newIntervalDays * 24 * 60 * 60 * 1000
  );

  // Set masteredAt if repetitions >= 3 AND intervalDays >= 21
  const isMastered = newRepetitions >= 3 && newIntervalDays >= 21;
  const masteredAt = isMastered ? oldMasteredAt ?? now : null;

  return {
    easeFactor: Number(newEaseFactor.toFixed(2)),
    intervalDays: newIntervalDays,
    repetitions: newRepetitions,
    nextReviewAt,
    lastReviewedAt: now,
    lastResult: rating,
    masteredAt,
  };
}

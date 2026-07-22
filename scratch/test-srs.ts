import { updateVocabularyProgress } from "E:/InternProjectV3/dangdai-app/lib/srs";

async function testSrs() {
  console.log("=== TESTING SM-2 ALGORITHM IN lib/srs.ts ===");

  // Review 1: Good rating
  const step1 = updateVocabularyProgress(null, "good");
  console.log("\nStep 1 ('good'):", {
    easeFactor: step1.easeFactor,
    intervalDays: step1.intervalDays,
    repetitions: step1.repetitions,
    lastResult: step1.lastResult,
    masteredAt: step1.masteredAt,
  });

  // Review 2: Good rating
  const step2 = updateVocabularyProgress(step1, "good");
  console.log("Step 2 ('good'):", {
    easeFactor: step2.easeFactor,
    intervalDays: step2.intervalDays,
    repetitions: step2.repetitions,
    lastResult: step2.lastResult,
    masteredAt: step2.masteredAt,
  });

  // Review 3: Easy rating (should reach repetitions >= 3 & intervalDays >= 21 -> masteredAt set)
  const step3 = updateVocabularyProgress(step2, "easy");
  console.log("Step 3 ('easy'):", {
    easeFactor: step3.easeFactor,
    intervalDays: step3.intervalDays,
    repetitions: step3.repetitions,
    lastResult: step3.lastResult,
    masteredAt: step3.masteredAt ? step3.masteredAt.toISOString() : null,
  });

  // Review 4: Again rating (should reset repetitions to 0, intervalDays to 1, masteredAt to null)
  const step4 = updateVocabularyProgress(step3, "again");
  console.log("Step 4 ('again' reset):", {
    easeFactor: step4.easeFactor,
    intervalDays: step4.intervalDays,
    repetitions: step4.repetitions,
    lastResult: step4.lastResult,
    masteredAt: step4.masteredAt,
  });

  console.log("\n=== SRS TEST COMPLETED SUCCESSFULLY ===");
  process.exit(0);
}

testSrs().catch((err) => {
  console.error("SRS test error:", err);
  process.exit(1);
});

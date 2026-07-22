import { prisma } from "E:/InternProjectV3/dangdai-app/app/admin/db";
import { restoreBackup, getLessonBackups } from "E:/InternProjectV3/dangdai-app/app/admin/lessons/[id]/backup-actions";

async function run() {
  console.log("=== CHECKING ALL BACKUPS FOR LESSON 1 ===");
  const backups = await prisma.lessonBackup.findMany({
    where: { lessonId: 1 },
    orderBy: { createdAt: "desc" },
  });

  console.log("Found backups total:", backups.length);
  backups.forEach((b) => {
    console.log(`[ID: ${b.id}] Type: ${b.type} | Action: ${b.action} | Note: ${b.note} | CreatedAt: ${b.createdAt}`);
  });

  // Find grammar backups
  const grammarBackups = backups.filter((b) => b.type === "grammar");
  if (grammarBackups.length > 0) {
    // Look for the one with the maximum items / grammar points
    let maxItemBackup = grammarBackups[0];
    let maxCount = 0;

    for (const gb of grammarBackups) {
      try {
        const parsed = JSON.parse(gb.data);
        if (Array.isArray(parsed) && parsed.length > maxCount) {
          maxCount = parsed.length;
          maxItemBackup = gb;
        }
      } catch {}
    }

    console.log(`\nRestoring backup ID ${maxItemBackup.id} with ${maxCount} grammar points...`);
    const res = await restoreBackup(maxItemBackup.id, 1);
    console.log("Restore Result:", res);
  }

  const currentPoints = await prisma.grammarPoint.findMany({
    where: { lessonId: 1 },
    orderBy: { order: "asc" },
  });
  console.log(`\nCurrent active Grammar Points (${currentPoints.length}):`);
  currentPoints.forEach((p) => console.log(` - ID ${p.id} (Order ${p.order}): ${p.title}`));

  process.exit(0);
}

run().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});

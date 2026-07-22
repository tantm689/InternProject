import { prisma } from "E:/InternProjectV3/dangdai-app/app/admin/db";
import { restoreBackup } from "E:/InternProjectV3/dangdai-app/app/admin/lessons/[id]/backup-actions";

async function find4PointsBackup() {
  console.log("=== SEARCHING FOR 4 POINTS BACKUP ===");
  const backups = await prisma.lessonBackup.findMany({
    where: { lessonId: 1, type: "grammar" },
  });

  for (const b of backups) {
    try {
      const parsed = JSON.parse(b.data);
      console.log(`Backup ID ${b.id}: ${parsed.length} points (${parsed.map((p: any) => p.title).join(", ")})`);
      if (parsed.length >= 4) {
        console.log(`\nFOUND 4-POINT BACKUP (ID: ${b.id})! Restoring...`);
        const res = await restoreBackup(b.id, 1);
        console.log("Restore Result:", res);
      }
    } catch {}
  }

  const currentPoints = await prisma.grammarPoint.findMany({ where: { lessonId: 1 } });
  console.log(`\nActive Points after search (${currentPoints.length}):`);
  currentPoints.forEach((p) => console.log(` - ID ${p.id} (Order ${p.order}): ${p.title}`));

  process.exit(0);
}

find4PointsBackup();

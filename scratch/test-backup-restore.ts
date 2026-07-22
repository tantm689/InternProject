import { prisma } from "E:/InternProjectV3/dangdai-app/app/admin/db";
import { restoreBackup, getLessonBackups } from "E:/InternProjectV3/dangdai-app/app/admin/lessons/[id]/backup-actions";
import { importGrammar } from "E:/InternProjectV3/dangdai-app/app/admin/lessons/[id]/import-actions";

async function testBackupAndRestore() {
  console.log("=== TESTING BACKUP AND RESTORE SYSTEM ===");
  const lessonId = 1;

  // 1. Check existing backups
  const backupsBefore = await getLessonBackups(lessonId);
  console.log("Backups before import count:", backupsBefore.backups?.length);

  // 2. Perform a new import (which triggers automatic backup)
  const newImportJson = JSON.stringify([
    {
      order: 1,
      title: "TEST BACKUP POINT",
      sections: [
        {
          tempId: "sec_test",
          parentTempId: null,
          order: 1,
          label: "Test Label",
          level: "main",
          text: "Test Text",
          examples: [],
        },
      ],
    },
  ]);

  console.log("Importing new test grammar...");
  await importGrammar(lessonId, newImportJson);

  // 3. Check backups after import
  const backupsAfter = await getLessonBackups(lessonId);
  console.log("Backups after import count:", backupsAfter.backups?.length);
  const latestBackup = backupsAfter.backups?.[0];
  console.log("Latest backup snapshot created:", latestBackup?.note, "at", latestBackup?.createdAt);

  if (latestBackup) {
    console.log("Testing RESTORE operation...");
    const restoreRes = await restoreBackup(latestBackup.id, lessonId);
    console.log("Restore result:", restoreRes);

    const currentPoints = await prisma.grammarPoint.findMany({ where: { lessonId } });
    console.log("Current Grammar Points count after restore:", currentPoints.length);
  }

  console.log("=== BACKUP AND RESTORE TEST COMPLETED SUCCESSFULLY ===");
  process.exit(0);
}

testBackupAndRestore().catch((err) => {
  console.error("Test backup error:", err);
  process.exit(1);
});

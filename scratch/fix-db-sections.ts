import { prisma } from "E:/InternProjectV3/dangdai-app/app/admin/db";

async function flattenDbSections() {
  console.log("=== FLATTENING ALL EXISTING SECTIONS IN DB ===");

  // 1. Remove empty sections that have no text and no examples
  const emptySections = await prisma.grammarSection.findMany({
    where: {
      text: "",
      examples: { none: {} },
    },
  });

  if (emptySections.length > 0) {
    console.log(`Deleting ${emptySections.length} empty header sections without content...`);
    await prisma.grammarSection.deleteMany({
      where: { id: { in: emptySections.map((s) => s.id) } },
    });
  }

  // 2. Set parentId to null for all sections (make them 100% same level)
  const updated = await prisma.grammarSection.updateMany({
    data: { parentId: null, level: "main" },
  });

  console.log(`Updated ${updated.count} sections to parentId: null (100% flat same-level).`);
  process.exit(0);
}

flattenDbSections().catch(console.error);

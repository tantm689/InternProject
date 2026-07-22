-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "sbtCutPath" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "sbtPageEnd" INTEGER;
ALTER TABLE "Lesson" ADD COLUMN "sbtPageStart" INTEGER;
ALTER TABLE "Lesson" ADD COLUMN "sgkCutPath" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "sgkPageEnd" INTEGER;
ALTER TABLE "Lesson" ADD COLUMN "sgkPageStart" INTEGER;
ALTER TABLE "Lesson" ADD COLUMN "teacherCutPath" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "teacherPageEnd" INTEGER;
ALTER TABLE "Lesson" ADD COLUMN "teacherPageStart" INTEGER;

-- AlterTable
ALTER TABLE "Volume" ADD COLUMN "sbtOffset" INTEGER;
ALTER TABLE "Volume" ADD COLUMN "sbtPdfPath" TEXT;
ALTER TABLE "Volume" ADD COLUMN "sgkOffset" INTEGER;
ALTER TABLE "Volume" ADD COLUMN "sgkPdfPath" TEXT;
ALTER TABLE "Volume" ADD COLUMN "teacherOffset" INTEGER;
ALTER TABLE "Volume" ADD COLUMN "teacherPdfPath" TEXT;

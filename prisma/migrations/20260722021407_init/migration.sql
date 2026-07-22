-- CreateTable
CREATE TABLE "Volume" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "volumeId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    CONSTRAINT "Lesson_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "Volume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vocabulary" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lessonId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "hanzi" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "meaningVi" TEXT NOT NULL,
    "partOfSpeech" TEXT,
    "exampleHanzi" TEXT,
    "examplePinyin" TEXT,
    "exampleVi" TEXT,
    CONSTRAINT "Vocabulary_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dialogue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lessonId" INTEGER NOT NULL,
    "dialogueNumber" INTEGER NOT NULL,
    "lineOrder" INTEGER NOT NULL,
    "speaker" TEXT,
    "hanzi" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "meaningVi" TEXT NOT NULL,
    "audioUrl" TEXT,
    CONSTRAINT "Dialogue_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrammarPoint" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lessonId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    CONSTRAINT "GrammarPoint_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrammarSection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "grammarPointId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "order" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "GrammarSection_grammarPointId_fkey" FOREIGN KEY ("grammarPointId") REFERENCES "GrammarPoint" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GrammarSection_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "GrammarSection" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrammarExample" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sectionId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "hanzi" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "meaningVi" TEXT NOT NULL,
    CONSTRAINT "GrammarExample_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "GrammarSection" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrammarExercise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "grammarPointId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "questionHanzi" TEXT,
    "questionVi" TEXT,
    "answer" TEXT NOT NULL,
    "explanation" TEXT,
    CONSTRAINT "GrammarExercise_grammarPointId_fkey" FOREIGN KEY ("grammarPointId") REFERENCES "GrammarPoint" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lessonId" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "questionHanzi" TEXT,
    "questionVi" TEXT,
    "answer" TEXT NOT NULL,
    "explanation" TEXT,
    CONSTRAINT "Exercise_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Volume_number_key" ON "Volume"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_volumeId_number_key" ON "Lesson"("volumeId", "number");

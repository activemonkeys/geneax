-- CreateEnum
CREATE TYPE "HarvestStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'PAUSED', 'FAILED');

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "oaiUrl" TEXT NOT NULL,
    "availableSets" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parserType" TEXT NOT NULL DEFAULT 'a2a',
    "parserConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL,
    "eventYear" INTEGER NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "setSpec" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "eventMonth" INTEGER,
    "eventDay" INTEGER,
    "eventDatePrecision" TEXT,
    "eventDateOriginal" TEXT,
    "eventPlace" TEXT,
    "rawData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id","eventYear")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "recordYear" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "givenName" TEXT,
    "surname" TEXT,
    "patronym" TEXT,
    "prefix" TEXT,
    "age" INTEGER,
    "birthYear" INTEGER,
    "occupation" TEXT,
    "residence" TEXT,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HarvestLog" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "setSpec" TEXT NOT NULL,
    "status" "HarvestStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "resumptionToken" TEXT,
    "recordsHarvested" INTEGER NOT NULL DEFAULT 0,
    "filesCreated" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "lastError" TEXT,

    CONSTRAINT "HarvestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Source_code_key" ON "Source"("code");

-- CreateIndex
CREATE INDEX "Record_sourceCode_idx" ON "Record"("sourceCode");

-- CreateIndex
CREATE INDEX "Record_recordType_idx" ON "Record"("recordType");

-- CreateIndex
CREATE INDEX "Record_eventYear_idx" ON "Record"("eventYear");

-- CreateIndex
CREATE INDEX "Record_eventPlace_idx" ON "Record"("eventPlace");

-- CreateIndex
CREATE INDEX "Person_recordId_recordYear_idx" ON "Person"("recordId", "recordYear");

-- CreateIndex
CREATE INDEX "Person_surname_idx" ON "Person"("surname");

-- CreateIndex
CREATE INDEX "Person_role_idx" ON "Person"("role");

-- CreateIndex
CREATE INDEX "Person_birthYear_idx" ON "Person"("birthYear");

-- CreateIndex
CREATE UNIQUE INDEX "HarvestLog_sourceId_setSpec_key" ON "HarvestLog"("sourceId", "setSpec");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_recordId_recordYear_fkey" FOREIGN KEY ("recordId", "recordYear") REFERENCES "Record"("id", "eventYear") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestLog" ADD CONSTRAINT "HarvestLog_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

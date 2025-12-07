-- CreateEnum
CREATE TYPE "RecordType" AS ENUM ('BS_BIRTH', 'BS_MARRIAGE', 'BS_DEATH', 'BS_DIVORCE', 'DTB_BAPTISM', 'DTB_MARRIAGE', 'DTB_BURIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "PersonRole" AS ENUM ('CHILD', 'FATHER', 'MOTHER', 'DECLARANT', 'GROOM', 'BRIDE', 'GROOM_FATHER', 'GROOM_MOTHER', 'BRIDE_FATHER', 'BRIDE_MOTHER', 'DECEASED', 'PARTNER', 'BAPTIZED', 'GODFATHER', 'GODMOTHER', 'WITNESS', 'OTHER');

-- CreateEnum
CREATE TYPE "HarvestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'PAUSED');

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "oaiUrl" TEXT NOT NULL,
    "availableSets" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "setSpec" TEXT NOT NULL,
    "recordType" "RecordType" NOT NULL,
    "eventYear" INTEGER NOT NULL,
    "eventDate" TIMESTAMP(3),
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
    "role" "PersonRole" NOT NULL,
    "givenName" TEXT,
    "surname" TEXT,
    "patronym" TEXT,
    "prefix" TEXT,
    "age" INTEGER,
    "birthYear" INTEGER,
    "occupation" TEXT,
    "residence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HarvestLog" (
    "id" SERIAL NOT NULL,
    "sourceId" TEXT NOT NULL,
    "setSpec" TEXT NOT NULL,
    "status" "HarvestStatus" NOT NULL DEFAULT 'PENDING',
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
CREATE INDEX "Record_setSpec_idx" ON "Record"("setSpec");

-- CreateIndex
CREATE INDEX "Record_recordType_idx" ON "Record"("recordType");

-- CreateIndex
CREATE INDEX "Record_eventPlace_idx" ON "Record"("eventPlace");

-- CreateIndex
CREATE INDEX "Person_recordId_recordYear_idx" ON "Person"("recordId", "recordYear");

-- CreateIndex
CREATE INDEX "Person_surname_idx" ON "Person"("surname");

-- CreateIndex
CREATE INDEX "Person_givenName_idx" ON "Person"("givenName");

-- CreateIndex
CREATE INDEX "Person_patronym_idx" ON "Person"("patronym");

-- CreateIndex
CREATE INDEX "Person_surname_givenName_idx" ON "Person"("surname", "givenName");

-- CreateIndex
CREATE INDEX "Person_birthYear_idx" ON "Person"("birthYear");

-- CreateIndex
CREATE INDEX "HarvestLog_status_idx" ON "HarvestLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HarvestLog_sourceId_setSpec_key" ON "HarvestLog"("sourceId", "setSpec");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_recordId_recordYear_fkey" FOREIGN KEY ("recordId", "recordYear") REFERENCES "Record"("id", "eventYear") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestLog" ADD CONSTRAINT "HarvestLog_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

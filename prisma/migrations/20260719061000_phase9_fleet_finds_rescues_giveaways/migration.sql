-- CreateTable
CREATE TABLE "FleetAssessment" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "insuranceAnnualCents" INTEGER,
    "storageAnnualCents" INTEGER,
    "opportunityCostAnnualCents" INTEGER,
    "mediaValueAnnualCents" INTEGER,
    "sponsorValueAnnualCents" INTEGER,
    "affiliateValueAnnualCents" INTEGER,
    "merchValueAnnualCents" INTEGER,
    "eventValueAnnualCents" INTEGER,
    "brandValueAnnualCents" INTEGER,
    "notes" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FleetAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleFind" (
    "id" TEXT NOT NULL,
    "submitterName" TEXT,
    "submitterEmail" TEXT,
    "vehicleDesc" TEXT NOT NULL,
    "year" INTEGER,
    "make" TEXT,
    "model" TEXT,
    "location" TEXT,
    "askingPriceCents" INTEGER,
    "photoUrl" TEXT,
    "notes" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'New',
    "valuePath" TEXT,
    "vehicleId" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleFind_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rescue" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "vehicleDesc" TEXT,
    "location" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'Find',
    "outcome" TEXT,
    "seriesId" TEXT,
    "vehicleId" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rescue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Giveaway" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prizeDescription" TEXT,
    "prizeValueCents" INTEGER,
    "vehicleId" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'Concept',
    "status" TEXT NOT NULL DEFAULT 'Planning',
    "attorneyReviewed" BOOLEAN NOT NULL DEFAULT false,
    "rulesApproved" BOOLEAN NOT NULL DEFAULT false,
    "eligibilityDefined" BOOLEAN NOT NULL DEFAULT false,
    "taxPlanApproved" BOOLEAN NOT NULL DEFAULT false,
    "funded" BOOLEAN NOT NULL DEFAULT false,
    "launchDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "drawDate" TIMESTAMP(3),
    "winnerName" TEXT,
    "winnerVerified" BOOLEAN NOT NULL DEFAULT false,
    "prizeTransferred" BOOLEAN NOT NULL DEFAULT false,
    "taxDocsSent" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Giveaway_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FleetAssessment_vehicleId_key" ON "FleetAssessment"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleFind_stage_idx" ON "VehicleFind"("stage");

-- CreateIndex
CREATE INDEX "Rescue_stage_idx" ON "Rescue"("stage");

-- CreateIndex
CREATE INDEX "Giveaway_stage_idx" ON "Giveaway"("stage");

-- CreateIndex
CREATE INDEX "Giveaway_status_idx" ON "Giveaway"("status");


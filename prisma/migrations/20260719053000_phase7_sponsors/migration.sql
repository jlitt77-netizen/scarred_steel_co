-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "website" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'Prospect',
    "level" TEXT,
    "exclusive" BOOLEAN NOT NULL DEFAULT false,
    "exclusiveCategory" TEXT,
    "cashValueCents" INTEGER,
    "productValueCents" INTEGER,
    "discountPct" INTEGER,
    "affiliateCommissionPct" INTEGER,
    "contractStart" TIMESTAMP(3),
    "contractEnd" TIMESTAMP(3),
    "renewalDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorDeliverable" (
    "id" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "episodeId" TEXT,
    "vehicleId" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Social Post',
    "status" TEXT NOT NULL DEFAULT 'Planned',
    "dueDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorDeliverable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sponsor_stage_idx" ON "Sponsor"("stage");

-- CreateIndex
CREATE INDEX "Sponsor_active_idx" ON "Sponsor"("active");

-- CreateIndex
CREATE INDEX "SponsorDeliverable_sponsorId_idx" ON "SponsorDeliverable"("sponsorId");

-- CreateIndex
CREATE INDEX "SponsorDeliverable_status_idx" ON "SponsorDeliverable"("status");

-- CreateIndex
CREATE INDEX "SponsorDeliverable_dueDate_idx" ON "SponsorDeliverable"("dueDate");

-- AddForeignKey
ALTER TABLE "SponsorDeliverable" ADD CONSTRAINT "SponsorDeliverable_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE CASCADE ON UPDATE CASCADE;


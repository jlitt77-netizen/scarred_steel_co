-- CreateTable
CREATE TABLE "PartnerShop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "hourlyRateCents" INTEGER,
    "capacityHoursPerWeek" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerShop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "partnerShopId" TEXT,
    "projectId" TEXT,
    "vehicleId" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'hourly',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "estimatedHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION,
    "hourlyRateCents" INTEGER,
    "fixedPriceCents" INTEGER,
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "invoicedCents" INTEGER,
    "invoiceDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT,
    "role" TEXT NOT NULL DEFAULT 'Other',
    "engagementType" TEXT NOT NULL DEFAULT 'contractor',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "hourlyRateCents" INTEGER,
    "salaryCents" INTEGER,
    "benefitsCents" INTEGER,
    "payrollBurdenPct" INTEGER,
    "bonusCents" INTEGER,
    "capacityHoursPerWeek" INTEGER,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "projectId" TEXT,
    "role" TEXT,
    "hoursPerWeek" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkOrder_partnerShopId_idx" ON "WorkOrder"("partnerShopId");

-- CreateIndex
CREATE INDEX "WorkOrder_projectId_idx" ON "WorkOrder"("projectId");

-- CreateIndex
CREATE INDEX "WorkOrder_status_idx" ON "WorkOrder"("status");

-- CreateIndex
CREATE INDEX "TeamMember_engagementType_idx" ON "TeamMember"("engagementType");

-- CreateIndex
CREATE INDEX "Assignment_teamMemberId_idx" ON "Assignment"("teamMemberId");

-- CreateIndex
CREATE INDEX "Assignment_projectId_idx" ON "Assignment"("projectId");

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_partnerShopId_fkey" FOREIGN KEY ("partnerShopId") REFERENCES "PartnerShop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;


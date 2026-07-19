-- CreateTable
CREATE TABLE "MerchProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "cogsCents" INTEGER,
    "retailCents" INTEGER,
    "inventoryQty" INTEGER NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER NOT NULL DEFAULT 0,
    "isDrop" BOOLEAN NOT NULL DEFAULT false,
    "dropDate" TIMESTAMP(3),
    "dropQuantity" INTEGER,
    "vehicleId" TEXT,
    "episodeId" TEXT,
    "sponsorId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "vendor" TEXT,
    "vehicleId" TEXT,
    "episodeId" TEXT,
    "sponsorId" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenueCents" INTEGER NOT NULL DEFAULT 0,
    "commissionPct" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Build Blueprint',
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "vehicleId" TEXT,
    "priceCents" INTEGER,
    "salesCount" INTEGER NOT NULL DEFAULT 0,
    "revenueCents" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlueprintSection" (
    "id" TEXT NOT NULL,
    "digitalProductId" TEXT,
    "vehicleId" TEXT,
    "title" TEXT NOT NULL,
    "phaseName" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT,
    "capturedDate" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlueprintSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MerchProduct_status_idx" ON "MerchProduct"("status");

-- CreateIndex
CREATE INDEX "MerchProduct_vehicleId_idx" ON "MerchProduct"("vehicleId");

-- CreateIndex
CREATE INDEX "AffiliateProduct_vehicleId_idx" ON "AffiliateProduct"("vehicleId");

-- CreateIndex
CREATE INDEX "DigitalProduct_type_idx" ON "DigitalProduct"("type");

-- CreateIndex
CREATE INDEX "DigitalProduct_status_idx" ON "DigitalProduct"("status");

-- CreateIndex
CREATE INDEX "BlueprintSection_digitalProductId_idx" ON "BlueprintSection"("digitalProductId");

-- CreateIndex
CREATE INDEX "BlueprintSection_vehicleId_idx" ON "BlueprintSection"("vehicleId");

-- AddForeignKey
ALTER TABLE "BlueprintSection" ADD CONSTRAINT "BlueprintSection_digitalProductId_fkey" FOREIGN KEY ("digitalProductId") REFERENCES "DigitalProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;


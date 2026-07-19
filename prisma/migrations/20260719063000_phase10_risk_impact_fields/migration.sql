-- AlterTable
ALTER TABLE "Risk" ADD COLUMN     "cashImpactCents" INTEGER,
ADD COLUMN     "costImpactCents" INTEGER,
ADD COLUMN     "revenueImpactCents" INTEGER,
ADD COLUMN     "scheduleImpactDays" INTEGER;


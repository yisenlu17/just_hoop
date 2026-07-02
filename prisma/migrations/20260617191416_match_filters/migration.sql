-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "city" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "gym" TEXT,
ADD COLUMN     "ratingMax" INTEGER,
ADD COLUMN     "ratingMin" INTEGER,
ADD COLUMN     "skillLevel" TEXT,
ADD COLUMN     "timeSlot" TEXT;

-- CreateIndex
CREATE INDEX "Match_city_district_gym_idx" ON "Match"("city", "district", "gym");

-- CreateIndex
CREATE INDEX "Match_timeSlot_idx" ON "Match"("timeSlot");

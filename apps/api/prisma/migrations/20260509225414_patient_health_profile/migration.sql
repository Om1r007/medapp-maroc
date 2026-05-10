-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('M', 'F', 'OTHER');

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "bloodType" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "conditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "heightCm" INTEGER,
ADD COLUMN     "medications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "sex" "Sex",
ADD COLUMN     "weightKg" INTEGER;

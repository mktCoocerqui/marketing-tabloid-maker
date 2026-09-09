-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_createdById_fkey";

-- DropForeignKey
ALTER TABLE "ProductImage" DROP CONSTRAINT "ProductImage_productId_fkey";

-- DropForeignKey
ALTER TABLE "Offer" DROP CONSTRAINT "Offer_productId_fkey";

-- DropIndex
DROP INDEX "Offer_category_idx";

-- DropIndex
DROP INDEX "TabloidOffer_sourceProductId_idx";

-- AlterTable
ALTER TABLE "Offer" DROP COLUMN "category",
DROP COLUMN "productId",
ADD COLUMN     "campaign" TEXT,
ADD COLUMN     "regularPrice" DECIMAL(12,2),
ADD COLUMN     "skuId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TabloidOffer" DROP COLUMN "category",
DROP COLUMN "sourceProductId",
ADD COLUMN     "regularPrice" DECIMAL(12,2),
ADD COLUMN     "skuId" TEXT;

-- DropTable
DROP TABLE "Product";

-- DropTable
DROP TABLE "ProductImage";

-- CreateTable
CREATE TABLE "ProductBase" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "subcategory" TEXT,
    "description" TEXT,
    "brand" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "mainImageUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sku" (
    "id" TEXT NOT NULL,
    "productBaseId" TEXT,
    "erpCode" TEXT,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT,
    "weight" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "altImageUrl" TEXT,
    "regularPrice" DECIMAL(12,2),
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "erpData" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sku_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductBase_category_idx" ON "ProductBase"("category");

-- CreateIndex
CREATE INDEX "ProductBase_name_idx" ON "ProductBase"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Sku_erpCode_key" ON "Sku"("erpCode");

-- CreateIndex
CREATE INDEX "Sku_productBaseId_idx" ON "Sku"("productBaseId");

-- CreateIndex
CREATE INDEX "Sku_barcode_idx" ON "Sku"("barcode");

-- CreateIndex
CREATE INDEX "Sku_name_idx" ON "Sku"("name");

-- CreateIndex
CREATE INDEX "Offer_skuId_idx" ON "Offer"("skuId");

-- CreateIndex
CREATE INDEX "TabloidOffer_skuId_idx" ON "TabloidOffer"("skuId");

-- AddForeignKey
ALTER TABLE "Sku" ADD CONSTRAINT "Sku_productBaseId_fkey" FOREIGN KEY ("productBaseId") REFERENCES "ProductBase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- RLS lockdown nas novas tabelas (app acessa via Prisma/owner; API pública bloqueada)
ALTER TABLE "ProductBase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sku" ENABLE ROW LEVEL SECURITY;

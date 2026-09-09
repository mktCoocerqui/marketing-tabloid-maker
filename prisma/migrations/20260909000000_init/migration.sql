-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'REVIEWER');

-- CreateEnum
CREATE TYPE "Orientation" AS ENUM ('PORTRAIT', 'LANDSCAPE');

-- CreateEnum
CREATE TYPE "TabloidStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('OPEN', 'APPROVED', 'REJECTED', 'STALE');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('PENDING', 'VIEWED', 'REVIEWED', 'APPROVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "shortDesc" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "internalCode" TEXT,
    "barcode" TEXT,
    "unit" TEXT,
    "metadata" JSONB,
    "mainImageUrl" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferType" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "configSchema" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OfferType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "typeId" TEXT NOT NULL DEFAULT 'simple',
    "title" TEXT,
    "imageUrl" TEXT,
    "price" DECIMAL(12,2),
    "previousPrice" DECIMAL(12,2),
    "unit" TEXT,
    "quantity" INTEGER,
    "dynamicData" JSONB,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "category" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formatId" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "theme" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageFormat" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "widthMm" DOUBLE PRECISION NOT NULL,
    "heightMm" DOUBLE PRECISION NOT NULL,
    "orientation" "Orientation" NOT NULL DEFAULT 'PORTRAIT',

    CONSTRAINT "PageFormat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplatePage" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "background" JSONB,
    "grid" JSONB,
    "elements" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "TemplatePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferFrame" (
    "id" TEXT NOT NULL,
    "templatePageId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "w" DOUBLE PRECISION NOT NULL,
    "h" DOUBLE PRECISION NOT NULL,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "z" INTEGER NOT NULL DEFAULT 0,
    "frameStyleId" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "groupLabel" TEXT,

    CONSTRAINT "OfferFrame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameStyle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,

    CONSTRAINT "FrameStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tabloid" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TabloidStatus" NOT NULL DEFAULT 'DRAFT',
    "formatId" TEXT NOT NULL,
    "templateId" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tabloid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabloidPage" (
    "id" TEXT NOT NULL,
    "tabloidId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "background" JSONB,
    "grid" JSONB,
    "elements" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "TabloidPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabloidOffer" (
    "id" TEXT NOT NULL,
    "tabloidId" TEXT NOT NULL,
    "sourceOfferId" TEXT,
    "sourceProductId" TEXT,
    "typeId" TEXT NOT NULL DEFAULT 'simple',
    "title" TEXT,
    "imageUrl" TEXT,
    "price" DECIMAL(12,2),
    "previousPrice" DECIMAL(12,2),
    "unit" TEXT,
    "quantity" INTEGER,
    "dynamicData" JSONB,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "category" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "TabloidOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabloidVersion" (
    "id" TEXT NOT NULL,
    "tabloidId" TEXT NOT NULL,
    "label" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TabloidVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabloidElement" (
    "id" TEXT NOT NULL,
    "frameStyleId" TEXT,

    CONSTRAINT "TabloidElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "tabloidId" TEXT NOT NULL,
    "versionId" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewParticipant" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "status" "ParticipantStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "ReviewParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewAction" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT,
    "kind" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Export" (
    "id" TEXT NOT NULL,
    "tabloidId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'done',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Export_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LayoutRun" (
    "id" TEXT NOT NULL,
    "tabloidId" TEXT NOT NULL,
    "templateId" TEXT,
    "input" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "manualDiff" JSONB,
    "weights" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LayoutRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_internalCode_key" ON "Product"("internalCode");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Offer_category_idx" ON "Offer"("category");

-- CreateIndex
CREATE INDEX "Tabloid_status_idx" ON "Tabloid"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TabloidPage_tabloidId_sortOrder_key" ON "TabloidPage"("tabloidId", "sortOrder");

-- CreateIndex
CREATE INDEX "TabloidOffer_tabloidId_idx" ON "TabloidOffer"("tabloidId");

-- CreateIndex
CREATE INDEX "TabloidOffer_sourceProductId_idx" ON "TabloidOffer"("sourceProductId");

-- CreateIndex
CREATE INDEX "TabloidVersion_tabloidId_idx" ON "TabloidVersion"("tabloidId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewParticipant_reviewId_userId_key" ON "ReviewParticipant"("reviewId", "userId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "OfferType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "PageFormat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplatePage" ADD CONSTRAINT "TemplatePage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferFrame" ADD CONSTRAINT "OfferFrame_templatePageId_fkey" FOREIGN KEY ("templatePageId") REFERENCES "TemplatePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferFrame" ADD CONSTRAINT "OfferFrame_frameStyleId_fkey" FOREIGN KEY ("frameStyleId") REFERENCES "FrameStyle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tabloid" ADD CONSTRAINT "Tabloid_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "PageFormat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tabloid" ADD CONSTRAINT "Tabloid_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tabloid" ADD CONSTRAINT "Tabloid_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabloidPage" ADD CONSTRAINT "TabloidPage_tabloidId_fkey" FOREIGN KEY ("tabloidId") REFERENCES "Tabloid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabloidOffer" ADD CONSTRAINT "TabloidOffer_tabloidId_fkey" FOREIGN KEY ("tabloidId") REFERENCES "Tabloid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabloidVersion" ADD CONSTRAINT "TabloidVersion_tabloidId_fkey" FOREIGN KEY ("tabloidId") REFERENCES "Tabloid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabloidElement" ADD CONSTRAINT "TabloidElement_frameStyleId_fkey" FOREIGN KEY ("frameStyleId") REFERENCES "FrameStyle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_tabloidId_fkey" FOREIGN KEY ("tabloidId") REFERENCES "Tabloid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "TabloidVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewParticipant" ADD CONSTRAINT "ReviewParticipant_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewParticipant" ADD CONSTRAINT "ReviewParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAction" ADD CONSTRAINT "ReviewAction_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Export" ADD CONSTRAINT "Export_tabloidId_fkey" FOREIGN KEY ("tabloidId") REFERENCES "Tabloid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LayoutRun" ADD CONSTRAINT "LayoutRun_tabloidId_fkey" FOREIGN KEY ("tabloidId") REFERENCES "Tabloid"("id") ON DELETE CASCADE ON UPDATE CASCADE;


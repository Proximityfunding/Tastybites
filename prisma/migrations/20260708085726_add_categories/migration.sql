-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_branchId_name_key" ON "Category"("branchId", "name");

-- CreateIndex
CREATE INDEX "Category_branchId_idx" ON "Category"("branchId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: add nullable categoryId column first
ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;

-- Data migration: create a Category row per distinct (branchId, category) pair
INSERT INTO "Category" ("id", "branchId", "name", "sortOrder", "createdAt")
SELECT gen_random_uuid()::text, t."branchId", t."category", 0, CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "branchId", "category" FROM "Product") t;

-- Data migration: point each product at its matching category
UPDATE "Product" p
SET "categoryId" = c."id"
FROM "Category" c
WHERE c."branchId" = p."branchId" AND c."name" = p."category";

-- AlterTable: enforce NOT NULL now that data is backfilled
ALTER TABLE "Product" ALTER COLUMN "categoryId" SET NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "Product_category_idx";

-- AlterTable: drop the old free-text category column
ALTER TABLE "Product" DROP COLUMN "category";

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

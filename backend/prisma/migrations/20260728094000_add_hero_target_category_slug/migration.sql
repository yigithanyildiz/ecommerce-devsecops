ALTER TABLE "StorefrontConfig" ADD COLUMN "heroTargetCategorySlug" TEXT;

UPDATE "StorefrontConfig"
SET "heroTargetCategorySlug" = 'clothing'
WHERE "id" = 'default' AND "heroTargetCategorySlug" IS NULL;

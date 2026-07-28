CREATE TABLE "StorefrontConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "heroEyebrow" TEXT NOT NULL DEFAULT 'NEW SEASON',
    "heroTitle" TEXT NOT NULL DEFAULT 'The Minimalist Collection',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'Sessiz lüks, seçili ürünler ve rafine alışveriş deneyimi.',
    "heroImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorefrontConfig_pkey" PRIMARY KEY ("id")
);

INSERT INTO "StorefrontConfig" (
    "id",
    "heroEyebrow",
    "heroTitle",
    "heroSubtitle",
    "heroImageUrl",
    "updatedAt"
) VALUES (
    'default',
    'NEW SEASON',
    'The Minimalist Collection',
    'Sessiz lüks, seçili ürünler ve rafine alışveriş deneyimi.',
    NULL,
    CURRENT_TIMESTAMP
);

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('DEMO_CARD', 'CASH_ON_DELIVERY');

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "recipientName" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "shippingCity" TEXT,
ADD COLUMN "shippingAddressLine" TEXT,
ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'DEMO_CARD',
ADD COLUMN "trackingNumber" TEXT;

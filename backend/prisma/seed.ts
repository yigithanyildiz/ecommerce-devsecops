import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
    },
  });

  const clothing = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: {
      name: 'Clothing',
      slug: 'clothing',
    },
  });

  await prisma.product.upsert({
    where: { slug: 'wireless-headphones' },
    update: {
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    },
    create: {
      name: 'Wireless Headphones',
      slug: 'wireless-headphones',
      description: 'Noise cancelling wireless headphones.',
      price: '129.99',
      stock: 25,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      categoryId: electronics.id,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'smart-watch' },
    update: {
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    },
    create: {
      name: 'Smart Watch',
      slug: 'smart-watch',
      description: 'Fitness and notification tracking smartwatch.',
      price: '199.99',
      stock: 12,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      categoryId: electronics.id,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'cotton-t-shirt' },
    update: {
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    },
    create: {
      name: 'Cotton T-Shirt',
      slug: 'cotton-t-shirt',
      description: 'Basic cotton t-shirt.',
      price: '24.99',
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
      categoryId: clothing.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
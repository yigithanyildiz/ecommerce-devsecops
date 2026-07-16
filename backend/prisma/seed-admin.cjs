require('dotenv/config');

const bcrypt = require('bcrypt');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const { ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD, DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required.');
}

if (!ADMIN_EMAIL) {
  throw new Error('ADMIN_EMAIL is required.');
}

if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
  throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
}

const adapter = new PrismaPg({
  connectionString: DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const name = ADMIN_NAME || 'Admin User';

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      name,
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  console.log(`Admin user ready: ${user.email} (${user.role})`);
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

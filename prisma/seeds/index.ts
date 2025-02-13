import { PrismaClient } from '@prisma/client';
import { seed as seedParts } from './parts.seed';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting seed...');
    await seedParts(prisma);
    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

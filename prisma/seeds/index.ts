import { PrismaClient } from '@prisma/client';
import { seed as seedParts } from './parts.seed';
import { seed as seedQuests } from './quests.seed';
import { seed as seedCharacters } from './characters.seed';
import { seed as seedAlienPartGroups } from './alienPartGroups.seed';
import { seed as seedRaid } from './raids.seed';
import { seed as seedPacks } from './packs.seed';
import { seed as seedItems } from './items.seed';
import { seed as seedDailyRewards } from './dailyRewards.seed';
import { seed as seedHunts } from './hunts.seed';
import { seed as seedStore } from './store.seed';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting seed...');
    // await seedParts(prisma);
    // await seedQuests(prisma);
    // await seedCharacters(prisma);
    // await seedRaid(prisma);
    await seedPacks(prisma);
    // await seedItems(prisma);
    // await seedDailyRewards(prisma);
    // await seedAlienPartGroups(prisma);
    // await seedHunts(prisma);
    // await seedStore(prisma);

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

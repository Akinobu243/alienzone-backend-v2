import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { StoreService } from '../../src/modules/store/store.service';

export async function seed(prisma: PrismaClient) {
  const configService = new ConfigService();
  // Create a PrismaService instance and pass it to CharacterService
  const prismaService = Object.assign(prisma, {
    onModuleInit: async () => {},
    onModuleDestroy: async () => {},
  });
  const storeService = new StoreService(prismaService);

  process.env.WEARABLES_CONTRACT_ADDRESS = configService.get(
    'WEARABLES_CONTRACT_ADDRESS',
  );
  process.env.RPC_PROVIDER = configService.get('RPC_PROVIDER');

  try {
    const result = await storeService.updateWearables(true);

    if (result.success) {
      console.log('Store items seeded successfully');
    } else {
      console.error('Error seeding store items:', result);
    }
  } catch (error) {
    console.error('Error during seeding:', error);
  }
}

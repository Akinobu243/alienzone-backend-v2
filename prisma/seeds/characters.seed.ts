import { PrismaClient } from '@prisma/client';
import { CharacterService } from '../../src/modules/character/character.service';
import { ConfigService } from '@nestjs/config';

export async function seed(prisma: PrismaClient) {
  const configService = new ConfigService();
  // Create a PrismaService instance and pass it to CharacterService
  const prismaService = Object.assign(prisma, {
    onModuleInit: async () => {},
    onModuleDestroy: async () => {},
  });
  const characterService = new CharacterService(prismaService, null);

  // Set environment variables for CharacterService
  process.env.AWS_BUCKET_NAME = configService.get('AWS_BUCKET_NAME');
  process.env.CONTRACT_ADDRESS = configService.get('CONTRACT_ADDRESS');
  process.env.RPC_PROVIDER = configService.get('RPC_PROVIDER');
  process.env.ADMIN_PRIVATE_KEY = configService.get('ADMIN_PRIVATE_KEY');

  try {
    // Call updateCharacterList to seed characters
    const result = await characterService.updateCharacterList();
    if (result.success) {
      console.log('Characters seeded successfully');
    } else {
      console.error('Error seeding characters:', result.error);
    }
  } catch (error) {
    console.error('Error during seeding:', error);
  }
}

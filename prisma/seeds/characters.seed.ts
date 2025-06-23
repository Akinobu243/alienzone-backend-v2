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
    // First update the character list
    const updateResult = await characterService.updateCharacterList();

    if (!updateResult.success) {
      console.error('Error updating character list:', updateResult.error);
      return;
    }

    // Then update the upgradeReq for all characters
    const attributeResult = await characterService.updateCharacterAttributes({
      upgradeReq: 3,
    });

    if (attributeResult.success) {
      console.log('Characters updated successfully');
    } else {
      console.error('Error updating characters:', attributeResult.error);
    }
  } catch (error) {
    console.error('Error during seeding:', error);
  }
}

import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';

import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { CharacterModule } from '../character/character.module';
import { StoreService } from '../store/store.service';
import { QuestModule } from '../quest/quest.module';
import { ReputationService } from './reputation.service';

@Module({
  imports: [PrismaModule, CharacterModule, QuestModule],
  controllers: [ProfileController],
  providers: [ProfileService, PrismaService, StoreService, ReputationService],
  exports: [ProfileService],
})
export class ProfileModule {}

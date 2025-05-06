import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QuestModule } from '../quest/quest.module';

import { RaidsController } from './raids.controller';
import { RaidsService } from './raids.service';
import { CharacterModule } from '../character/character.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [PrismaModule, QuestModule, CharacterModule, ProfileModule],
  controllers: [RaidsController],
  providers: [RaidsService, PrismaService],
  exports: [RaidsService],
})
export class RaidsModule {}

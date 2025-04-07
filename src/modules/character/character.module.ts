import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';

import { CharacterController } from './character.controller';
import { CharacterService } from './character.service';
import { ScheduleModule } from '@nestjs/schedule';
import { QuestModule } from '../quest/quest.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot(), QuestModule],
  controllers: [CharacterController],
  providers: [CharacterService, PrismaService],
  exports: [CharacterService],
})
export class CharacterModule {}

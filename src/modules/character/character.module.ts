import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';

import { CharacterController } from './character.controller';
import { CharacterService } from './character.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [CharacterController],
  providers: [CharacterService, PrismaService],
  exports: [CharacterService],
})
export class CharacterModule {}

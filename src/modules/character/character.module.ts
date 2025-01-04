import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';

import { CharacterController } from './character.controller';
import { CharacterService } from './character.service';

@Module({
  imports: [PrismaModule],
  controllers: [CharacterController],
  providers: [CharacterService, PrismaService],
  exports: [CharacterService],
})
export class CharacterModule {}

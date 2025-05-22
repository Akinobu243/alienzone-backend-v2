import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';

import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { CharacterModule } from '../character/character.module';
import { StoreService } from '../store/store.service';

@Module({
  imports: [PrismaModule, CharacterModule],
  controllers: [ProfileController],
  providers: [ProfileService, PrismaService, StoreService],
  exports: [ProfileService],
})
export class ProfileModule {}

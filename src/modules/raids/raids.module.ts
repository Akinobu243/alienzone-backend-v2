import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';

import { RaidsController } from './raids.controller';
import { RaidsService } from './raids.service';

@Module({
  imports: [PrismaModule],
  controllers: [RaidsController],
  providers: [RaidsService, PrismaService],
  exports: [RaidsService],
})
export class RaidsModule {}

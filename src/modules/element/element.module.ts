import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';

import { ElementController } from './element.controller';
import { ElementService } from './element.service';

@Module({
  imports: [PrismaModule],
  controllers: [ElementController],
  providers: [ElementService, PrismaService],
  exports: [ElementService],
})
export class ElementModule {}

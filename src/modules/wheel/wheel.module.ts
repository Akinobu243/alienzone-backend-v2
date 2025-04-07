import { Module } from '@nestjs/common';
import { WheelService } from './wheel.service';
import { WheelController } from './wheel.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { QuestModule } from '../quest/quest.module';

@Module({
  imports: [PrismaModule, QuestModule],
  controllers: [WheelController],
  providers: [WheelService],
  exports: [WheelService],
})
export class WheelModule {}

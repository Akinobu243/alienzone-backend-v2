import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QuestService } from '../quest/quest.service';
import { QuestModule } from '../quest/quest.module';

@Module({
  imports: [PrismaModule, QuestModule],
  controllers: [StoreController],
  providers: [StoreService, QuestService],
  exports: [StoreService],
})
export class StoreModule {}

import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CharacterModule } from '../character/character.module';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [PrismaModule, CharacterModule, StoreModule],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}

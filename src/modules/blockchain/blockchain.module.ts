import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from './blockchain.service';
import { WearableTradeEventParser } from "./wearable_trade_event_parser";

@Module({
  providers: [BlockchainService, WearableTradeEventParser, PrismaService],
  exports: [BlockchainService],
})
export class BlockchainModule {}

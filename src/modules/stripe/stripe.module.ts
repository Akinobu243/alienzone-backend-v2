import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PacksModule } from '../packs/packs.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, PacksModule, ConfigModule],
  providers: [StripeService],
  controllers: [StripeController],
  exports: [StripeService],
})
export class StripeModule {}
import { Module } from '@nestjs/common';
import { MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GLOBAL_CONFIG } from '../../configs/global.config';
import { LoggerModule } from '../logger/logger.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { LoggerMiddleware } from '../../middlewares/logger.middleware';
import { ProfileModule } from '../profile/profile.module';
import { RaidsModule } from '../raids/raids.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CharacterModule } from '../character/character.module';
import { ItemsModule } from '../items/items.module';
import { MulterModule } from '@nestjs/platform-express';
import { PacksModule } from '../packs/packs.module';
import { StripeModule } from '../stripe/stripe.module';
import { ElementModule } from '../element/element.module';
import { InventoryModule } from '../inventory/inventory.module';
import { WheelModule } from '../wheel/wheel.module';

@Module({
  imports: [
    LoggerModule,
    PrismaModule,
    AuthModule,
    UserModule,
    ProfileModule,
    CharacterModule,
    ItemsModule,
    RaidsModule,
    MulterModule.register({
      dest: './uploads',
      limits: {
        fieldSize: 1000 * 1000 * 10,
      },
    }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, load: [() => GLOBAL_CONFIG] }),
    PacksModule,
    StripeModule,
    ElementModule,
    InventoryModule,
    WheelModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

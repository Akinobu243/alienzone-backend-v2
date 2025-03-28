import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { WheelModule } from './modules/wheel/wheel.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { RaidsModule } from './modules/raids/raids.module';
import { ProfileModule } from './modules/profile/profile.module';
import { PacksModule } from './modules/packs/packs.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ElementModule } from './modules/element/element.module';
import { CharacterModule } from './modules/character/character.module';
import { QuestModule } from './modules/quest/quest.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    WheelModule,
    StripeModule,
    RaidsModule,
    ProfileModule,
    PacksModule,
    InventoryModule,
    ElementModule,
    CharacterModule,
    QuestModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ForgeService } from './forge.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [PrismaModule, ProfileModule],
  providers: [ForgeService],
  exports: [ForgeService],
})
export class ForgeModule {}

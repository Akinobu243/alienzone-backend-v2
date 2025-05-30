import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from '../profile/profile.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ForgeService {
  private readonly logger = new Logger(ForgeService.name);

  constructor(
    private prisma: PrismaService,
    private profileService: ProfileService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleForgeCompletion() {
    try {
      this.logger.log('Checking for completed forges...');

      // Get all alien parts with active forges
      const alienParts = await this.prisma.alienPart.findMany({
        where: {
          userPowers: {
            not: Prisma.JsonNull,
          },
        },
      });

      for (const alienPart of alienParts) {
        const userForgeTime = ((alienPart as any).userForgeTime || []) as {
          userId: number;
          timer: string;
        }[];

        // Process each user's forge
        for (const forge of userForgeTime) {
          const timeLeft = Math.max(
            0,
            new Date(forge.timer).getTime() - new Date().getTime(),
          );

          if (timeLeft <= 0) {
            // Get user's wallet address
            const user = await this.prisma.user.findUnique({
              where: { id: forge.userId },
            });

            if (user) {
              // Complete the forge
              await this.profileService.forgeParts(
                user.walletAddress,
                alienPart.id,
              );
              this.logger.log(
                `Completed forge for user ${user.walletAddress} and part ${alienPart.id}`,
              );
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Error in forge completion handler:', error);
    }
  }
}

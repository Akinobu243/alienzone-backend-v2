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

      // PERF: Collect all user IDs that have expired forges, then batch-fetch users
      const expiredPartForges: { userId: number; alienPartId: number }[] = [];
      const expiredElementForges: { userId: number; elementId: number }[] = [];
      const allUserIds = new Set<number>();

      for (const alienPart of alienParts) {
        const userForgeTime = ((alienPart as any).userForgeTime || []) as {
          userId: number;
          timer: string;
        }[];

        for (const forge of userForgeTime) {
          const timeLeft = Math.max(
            0,
            new Date(forge.timer).getTime() - new Date().getTime(),
          );
          if (timeLeft <= 0) {
            expiredPartForges.push({ userId: forge.userId, alienPartId: alienPart.id });
            allUserIds.add(forge.userId);
          }
        }
      }

      const elements = await this.prisma.element.findMany({
        where: { isForgeable: true },
      });

      for (const element of elements) {
        const userForgeTime = (element.userForgeTime || []) as {
          userId: number;
          timer: string;
        }[];

        for (const forge of userForgeTime) {
          const timeLeft = Math.max(
            0,
            new Date(forge.timer).getTime() - new Date().getTime(),
          );
          if (timeLeft <= 0) {
            expiredElementForges.push({ userId: forge.userId, elementId: element.id });
            allUserIds.add(forge.userId);
          }
        }
      }

      // Early exit if no expired forges
      if (allUserIds.size === 0) return;

      // PERF: Single batch query for all users instead of one per expired forge
      const users = await this.prisma.user.findMany({
        where: { id: { in: [...allUserIds] } },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      // Process expired part forges
      for (const forge of expiredPartForges) {
        const user = userMap.get(forge.userId);
        if (user) {
          await this.profileService.forgeParts(
            user.walletAddress,
            forge.alienPartId,
            null,
          );
          this.logger.log(
            `Completed forge for user ${user.walletAddress} and part ${forge.alienPartId}`,
          );
        }
      }

      // Process expired element forges
      for (const forge of expiredElementForges) {
        const user = userMap.get(forge.userId);
        if (user) {
          await this.profileService.forgeParts(
            user.walletAddress,
            null,
            forge.elementId,
          );
          this.logger.log(
            `Completed forge for user ${user.walletAddress} and element ${forge.elementId}`,
          );
        }
      }

    } catch (error) {
      this.logger.error('Error in forge completion handler:', error);
    }
  }
}

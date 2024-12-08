import { Prisma, RewardType, User } from '@prisma/client';
import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateRaidDTO, LaunchRaidDTO, RaidReward } from './dto/raids.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RaidsService {
  constructor(private prisma: PrismaService) {}

  public async getRaidsList() {
    return await this.prisma.raid.findMany();
  }

  public async createRaid(title: string, description: string, duration: number, rewards: RaidReward[]) {
    const data: Prisma.RaidCreateInput = {
      title,
      description,
      duration,
      rewards: {
        create: rewards,
      },
    };
    await this.prisma.raid.create({ data });
  }

  public async launchRaid(raidId: number, alienIds: number[], userWalletAddress: string) {
    const raid = await this.prisma.raid.findUnique({
      where: { id: raidId }
    });
    if (!raid) {
      throw new BadRequestException('Raid not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { walletAddress: userWalletAddress }
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const aliens = await this.prisma.alien.findMany({
      where: {
        id: { in: alienIds },
        userId: user.id,
      }
    });
    if (aliens.length !== alienIds.length) {
      throw new BadRequestException('Aliens not found');
    }

    for (const alien of aliens) {
      if (alien.inRaid) {
        throw new BadRequestException('An alien is already in raid');
      }
    }

    const data: Prisma.RaidHistoryCreateInput = {
      raid: {
        connect: { id: raidId },
      },
      user: {
        connect: { id: user.id },
      },
      aliens: {
        connect: alienIds.map((id) => ({ id })),
      },
    };
    await this.prisma.raidHistory.create({ data });

  }

  public async getRaidHistory(userWalletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: userWalletAddress }
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return await this.prisma.raidHistory.findMany({
      where: {
        userId: user.id,
      },
      include: {
        aliens: true,
      }
    });
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processRaidRewards() {
    const raids = await this.prisma.raidHistory.findMany({
      where: {
        inProgress: true,
      },
      include: {
        aliens: true,
        raid: {
          include: {
            rewards: true,
          }
        }
      }
    });

    for (const raid of raids) {
      const raidAliens = raid.aliens;
      const raidRewards = raid.raid.rewards;
      const raidUserId = raid.userId;

      // TODO: Add alien bonuses to raid completion time based on elements

      if (raid.createdAt.getTime() + raid.raid.duration * 1000 < Date.now()) {
        await this.prisma.raidHistory.update({
          where: { id: raid.id },
          data: {
            inProgress: false,
          }
        });

        for (const reward of raidRewards) {
          await this.prisma.user.update({
            where: { id: raidUserId },
            data: {
              [reward.type]: {
                increment: reward.amount,
              }
            }
          });
      }

      }
    }
  }
}

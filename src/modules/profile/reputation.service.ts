import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ReputationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Runs every Thursday at 23:59:59
   * This will store the current reputation points and reset them
   */
  @Cron('59 59 23 * * 4')
  async storeAndResetWeeklyReputation() {
    const now = new Date();

    // Calculate last Friday (start of the week)
    const weekStarting = new Date(now);
    // If today is Thursday (4), go back 6 days to get to last Friday
    // For any other day, calculate days to go back to reach last Friday
    const daysToLastFriday = (now.getDay() + 2) % 7;
    weekStarting.setDate(now.getDate() - daysToLastFriday);
    weekStarting.setHours(0, 0, 0, 0);

    // Current Thursday (end of week) is the current time
    const weekEnding = new Date(now);
    weekEnding.setHours(23, 59, 59, 999);

    try {
      // Get all users with their current reputation
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          reputation: true,
        },
      });

      // Store current reputation points in history
      await this.prisma.$transaction(
        users.map((user) =>
          this.prisma.weeklyReputationHistory.create({
            data: {
              userId: user.id,
              points: user.reputation,
              weekStarting,
              weekEnding,
            },
          }),
        ),
      );

      // Reset all users' reputation to 0
      await this.prisma.user.updateMany({
        data: {
          reputation: 0,
        },
      });

      console.log('Weekly reputation points have been stored and reset');
    } catch (error) {
      console.error('Error in weekly reputation reset:', error);
    }
  }

  /**
   * Get historical reputation points for a user
   */
  async getReputationHistory(walletAddress: string, limit = 10) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      select: { id: true },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const history = await this.prisma.weeklyReputationHistory.findMany({
      where: { userId: user.id },
      orderBy: { weekStarting: 'desc' },
      take: limit,
    });

    return {
      success: true,
      history,
    };
  }
}

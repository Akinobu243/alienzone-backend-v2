import { Prisma, User } from '@prisma/client';
import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { WALLETADDRESS_ALREADY_EXISTS } from 'src/shared/constants/strings';
import exp from 'constants';
import { CreateAlienDTO } from './dto/profile.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  public async getProfile(walletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    return {
      walletAddress: user.walletAddress,
      name: user.name,
      country: user.country,
      twitterId: user.twitterId,
      image: user.image,
      level: user.level,
      experience: user.experience,
      reputation: user.reputation,
      stars: user.stars,
    };
  }

  public async createAlien(
    walletAddress: string,
    createAlienDTO: CreateAlienDTO
  ) {
    await this.prisma.alien.create({
      data: {
        ...createAlienDTO,
        inRaid: false,
        user: {
          connect: { walletAddress }
        }
      },
    });
  }

  public async getAliens(walletAddress: string) {
    const aliens = await this.prisma.alien.findMany({
      where: {
        user: {
          walletAddress: walletAddress,
        }
      },
    });

    return aliens;
  }

  public async getLeaderboard() {
    const users = await this.prisma.user.findMany({
      orderBy: {
        reputation: 'desc',
      },
      take: 10,
    });

    return users.map(user => {
      return {
        name: user.name,
        country: user.country,
        enterprise: user.enterprise,
        image: user.image,
        level: user.level,
        experience: user.experience,
        reputation: user.reputation,
      };
    });
  }

  public async updateStarBalance(walletAddress: string, amount: number, increment: boolean) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const newBalance = increment ? user.stars + amount : user.stars - amount;
    await this.prisma.user.update({
      where: {
        walletAddress,
      },
      data: {
        stars: newBalance,
      },
    });
  }

}

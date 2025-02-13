import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Pack, PackReward } from '@prisma/client';

@Injectable()
export class PacksService {
  constructor(private prisma: PrismaService) {}

  async getAllPacks(walletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
      include: {
        purchasedPacks: true,
      },
    });

    // add additional field to check if user has purchased pack
    const packs = await this.prisma.pack.findMany({
      where: {
        isActive: true,
      },
      include: {
        rewards: {
          include: {
            alienParts: true,
          },
        },
      },
    });

    return packs.map((pack) => ({
      ...pack,
      isPurchased: user.purchasedPacks.some((p) => p.id === pack.id),
    }));
  }

  async getPackById(id: number) {
    return this.prisma.pack.findUnique({
      where: { id },
      include: {
        rewards: {
          include: {
            alienParts: true,
          },
        },
      },
    });
  }

  async getDefaultPacks() {
    return this.prisma.pack.findMany({
      where: {
        isActive: true,
        price: 0,
      },
      include: {
        rewards: {
          include: {
            alienParts: true,
          },
        },
      },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Pack, PackReward } from '@prisma/client';

@Injectable()
export class PacksService {
  constructor(private prisma: PrismaService) {}

  async getAllPacks() {
    return this.prisma.pack.findMany({
      where: {
        isActive: true,
      },
      include: {
        rewards: {
          include: {
            alienPart: true,
          },
        },
      },
    });
  }

  async getPackById(id: number) {
    return this.prisma.pack.findUnique({
      where: { id },
      include: {
        rewards: {
          include: {
            alienPart: true,
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
            alienPart: true,
          },
        },
      },
    });
  }
}
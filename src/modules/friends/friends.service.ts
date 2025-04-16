import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  async addFriend(userWallet: string, friendWallet: string) {
    if (userWallet === friendWallet) {
      throw new BadRequestException('You cannot add yourself as a friend');
    }

    const [user, friend] = await Promise.all([
      this.prisma.user.findUnique({ where: { walletAddress: userWallet } }),
      this.prisma.user.findUnique({ where: { walletAddress: friendWallet } }),
    ]);

    if (!user || !friend) {
      throw new BadRequestException('User or friend not found');
    }

    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: user.id, friendId: friend.id },
          { userId: friend.id, friendId: user.id },
        ],
      },
    });

    if (existingFriendship) {
      throw new BadRequestException('Friendship already exists');
    }

    return this.prisma.friendship.create({
      data: { userId: user.id, friendId: friend.id },
    });
  }

  async removeFriend(userWallet: string, friendWallet: string) {
    const [user, friend] = await Promise.all([
      this.prisma.user.findUnique({ where: { walletAddress: userWallet } }),
      this.prisma.user.findUnique({ where: { walletAddress: friendWallet } }),
    ]);

    if (!user || !friend) {
      throw new BadRequestException('User or friend not found');
    }

    return this.prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId: user.id, friendId: friend.id },
          { userId: friend.id, friendId: user.id },
        ],
      },
    });
  }

  async getFriends(walletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const userId = user.id;

    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ userId }, { friendId: userId }],
      },
    });

    return friendships.map((f) =>
      f.userId === userId ? f.friendId : f.userId,
    );
  }
}

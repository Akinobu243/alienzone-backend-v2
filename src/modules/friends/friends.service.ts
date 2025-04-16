import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  async addFriend(userId: number, friendId: number) {
    if (userId === friendId) {
      throw new BadRequestException('You cannot add yourself as a friend');
    }

    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    if (existingFriendship) {
      throw new BadRequestException('Friendship already exists');
    }

    return this.prisma.friendship.create({
      data: { userId, friendId },
    });
  }

  async removeFriend(userId: number, friendId: number) {
    return this.prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });
  }

  async getFriends(userId: number) {
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

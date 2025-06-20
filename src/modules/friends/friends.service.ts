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

  async addFriendsById(userWallet: string, friendIds: string[]) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: userWallet },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    friendIds = friendIds.filter((id) => Number(id) !== user.id);

    if (friendIds.length === 0) {
      throw new BadRequestException('No valid friend IDs provided');
    }

    // Get all potential friends
    const friends = await this.prisma.user.findMany({
      where: { id: { in: friendIds.map(Number) } },
    });

    if (friends.length === 0) {
      throw new BadRequestException('No valid friends found');
    }

    // Get existing friendships
    const existingFriendships = await this.prisma.friendship.findMany({
      where: {
        OR: friends.flatMap((friend) => [
          { userId: user.id, friendId: friend.id },
          { userId: friend.id, friendId: user.id },
        ]),
      },
    });

    // Create a set of existing friendship pairs for easy lookup
    const existingPairs = new Set(
      existingFriendships.map((f) =>
        f.userId === user.id
          ? `${f.userId}-${f.friendId}`
          : `${f.friendId}-${f.userId}`,
      ),
    );

    // Filter out friends that already exist
    const newFriendships = friends.filter(
      (friend) =>
        !existingPairs.has(`${user.id}-${friend.id}`) &&
        !existingPairs.has(`${friend.id}-${user.id}`),
    );

    if (newFriendships.length === 0) {
      throw new BadRequestException('Friendship already exists');
    }

    // Create new friendships
    const createdFriendships = await this.prisma.friendship.createMany({
      data: newFriendships.map((friend) => ({
        userId: user.id,
        friendId: friend.id,
      })),
    });

    return {
      success: true,
      added: createdFriendships.count,
      total: friendIds.length,
      skipped: friendIds.length - createdFriendships.count,
    };
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

  async searchUsers(walletAddress: string, query: string, limit = 10) {
    if (!query || query.trim() === '') {
      return [];
    }

    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Get current user's friends to exclude them from results
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ userId: user.id }, { friendId: user.id }],
      },
    });

    const friendIds = friendships.map((f) =>
      f.userId === user.id ? f.friendId : f.userId,
    );

    console.log('friendIds ====>', friendIds);

    console.log('query ====>', query);

    // Search for users by name or wallet address with partial match
    // Exclude the current user and their existing friends
    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                name: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                walletAddress: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            ],
          },
          {
            id: {
              not: user.id,
              notIn: friendIds,
            },
          },
        ],
      },
      include: {
        aliens: {
          where: { selected: true },
          take: 1,
        },
      },
      take: limit,
    });

    console.log('users ====>', users);

    // Format the response similar to getFriends
    return users.map((foundUser) => ({
      id: foundUser.id,
      name: foundUser.name,
      level: foundUser.level,
      walletAddress: foundUser.walletAddress,
      image: foundUser.aliens.length > 0 ? foundUser.aliens[0].image : null,
    }));
  }

  async toggleFriendPin(userWallet: string, friendId: number) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: userWallet },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Find the friendship
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: user.id, friendId: friendId },
          { userId: friendId, friendId: user.id },
        ],
      },
    });

    console.log('friendship ====>', friendship);

    if (!friendship) {
      throw new BadRequestException('Friendship not found');
    }

    // Toggle the isPinned status
    await this.prisma.friendship.update({
      where: { id: friendship.id },
      data: { isPinned: !friendship.isPinned },
    });

    // Return updated friends list
    return this.getFriends(userWallet);
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
      include: {
        user: true,
        friend: true,
      },
      orderBy: {
        isPinned: 'desc', // Sort pinned friends first
      },
    });

    // Get friend IDs
    const friendIds = friendships.map((f) =>
      f.userId === userId ? f.friendId : f.userId,
    );

    // Fetch friends with their aliens
    const friends = await this.prisma.user.findMany({
      where: {
        id: { in: friendIds },
      },
      include: {
        aliens: {
          where: { selected: true },
          take: 1,
          include: {
            element: true,
          },
        },
      },
    });

    // Fetch last messages for each friend
    const lastMessages = await Promise.all(
      friendIds.map(async (friendId) => {
        const message = await this.prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: friendId },
              { senderId: friendId, receiverId: userId },
            ],
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            content: true,
            createdAt: true,
          },
        });

        return {
          friendId,
          message: message
            ? {
                content: message.content,
                timestamp: this.formatRelativeTime(message.createdAt),
              }
            : null,
        };
      }),
    );

    // Create a map of friendId to last message for easy lookup
    const messageMap = new Map(
      lastMessages.map((item) => [item.friendId, item.message]),
    );

    // Create a map of friendId to isPinned status
    const pinnedMap = new Map(
      friendships.map((f) => [
        f.userId === userId ? f.friendId : f.userId,
        f.isPinned,
      ]),
    );

    // Map to the required format
    return friends.map((friend) => ({
      id: friend.id,
      name: friend.name,
      walletAddress: friend.walletAddress,
      level: friend.level,
      image: friend.aliens.length > 0 ? friend.aliens[0].image : null,
      element: friend.aliens.length > 0 ? friend.aliens[0].element.image : null,
      message: messageMap.get(friend.id) || { content: '', timestamp: '' },
      isPinned: pinnedMap.get(friend.id) || false,
    }));
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffMonth / 12);

    if (diffSec < 60) return `${diffSec}s`;
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHour < 24) return `${diffHour}h`;
    if (diffDay < 30) return `${diffDay}d`;
    if (diffMonth < 12) return `${diffMonth}months`;
    return `${diffYear}y`;
  }
}

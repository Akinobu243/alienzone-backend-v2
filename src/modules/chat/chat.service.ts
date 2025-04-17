import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(
    walletAddress: string,
    receiverId: number | null,
    content: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    const senderId = user.id;

    if (!content.trim()) {
      throw new BadRequestException('Message content cannot be empty');
    }

    return this.prisma.message.create({
      data: {
        senderId,
        receiverId: Number(receiverId),
        content,
      },
    });
  }

  async getMessages(
    walletAddress: string,
    friendId: number | null,
    offset: number,
    limit: number,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    const userId = user.id;
    // Convert friendId to number if it's a string, or keep as null if null
    const parsedFriendId = friendId !== null ? Number(friendId) : null;

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: parsedFriendId },
          { senderId: parsedFriendId, receiverId: userId },
        ],
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        senderId: true,
        sender: {
          select: {
            walletAddress: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: limit,
    });

    // Convert createdAt to Unix timestamp in milliseconds
    return messages.map((message) => ({
      id: message.id,
      content: message.content,
      timestamp: message.createdAt.getTime(),
      senderId: message.senderId,
      senderWalletAddress: message.sender.walletAddress,
    }));
  }

  async getGlobalMessages(offset: number, limit: number) {
    return this.prisma.message.findMany({
      where: { receiverId: null },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
  }
}

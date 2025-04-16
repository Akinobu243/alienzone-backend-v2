import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(
    senderId: number,
    receiverId: number | null,
    content: string,
  ) {
    if (!content.trim()) {
      throw new BadRequestException('Message content cannot be empty');
    }

    return this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
    });
  }

  async getMessages(
    userId: number,
    friendId: number | null,
    offset: number,
    limit: number,
  ) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
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

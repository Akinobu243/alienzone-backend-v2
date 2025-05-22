import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuestService } from '../quest/quest.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private readonly questService: QuestService,
  ) {}

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

    try {
      await this.questService.progressMessageQuest(walletAddress);
    } catch (error) {
      console.error('Error progressing message quest:', error);
    }

    return this.prisma.message.create({
      data: {
        senderId,
        receiverId: receiverId ? Number(receiverId) : null,
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
      // skip: offset,
      // take: limit,
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

  // inside ChatService
  async getGlobalMessages(offset: number, limit: number) {
    const raw = await this.prisma.message.findMany({
      where: { receiverId: null },
      orderBy: { createdAt: 'asc' },
      // skip: offset,
      // take: limit,
      include: {
        sender: {
          select: {
            walletAddress: true,
            name: true,
            aliens: {
              take: 1,
              select: {
                image: true,
                element: {
                  select: {
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return raw.map((m) => ({
      id: m.id,
      content: m.content,
      timestamp: m.createdAt.getTime(),
      formattedDate: this.formatTimestamp(m.createdAt),
      senderId: m.senderId,
      senderName: m.sender.name,
      senderImage: m.sender.aliens[0]?.image ?? null,
      elementImage:
        m.sender.aliens.length > 0 ? m.sender.aliens[0].element.image : null,
    }));
  }

  /**
   * Turn a Date into:
   *  • “Today at 2:39 pm”
   *  • “Yesterday at 2:30 pm”
   *  • “Jan 15, 2024 at 5:10 pm”
   */
  private formatTimestamp(date: Date): string {
    const now = new Date();
    // midnight today
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // midnight of the message day
    const msgDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const diffDays =
      (today.getTime() - msgDay.getTime()) / (1000 * 60 * 60 * 24);

    const timePart = date
      .toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      })
      .toLowerCase(); // “2:39 pm”

    if (diffDays === 0) {
      return `Today at ${timePart}`;
    }
    if (diffDays === 1) {
      return `Yesterday at ${timePart}`;
    }

    const datePart = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }); // “Jan 15, 2024”

    return `${datePart} at ${timePart}`;
  }
}

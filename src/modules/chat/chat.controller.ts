import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('chat')
@Controller('/chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @UseGuards(AuthGuard)
  @Post('/send')
  async sendMessage(
    @Request() req,
    @Body('receiverId') receiverId: number | null,
    @Body('content') content: string,
  ) {
    return this.chatService.sendMessage(req.walletAddress, receiverId, content);
  }

  @UseGuards(AuthGuard)
  @Get('/messages')
  async getMessages(
    @Request() req,
    @Query('friendId') friendId: number | null,
    @Query('offset') offset: number = 0,
    @Query('limit') limit: number = 10,
  ) {
    return friendId
      ? this.chatService.getMessages(req.walletAddress, friendId, offset, limit)
      : this.chatService.getGlobalMessages(offset, limit);
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('friends')
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @UseGuards(AuthGuard)
  @Post('/add')
  async addFriend(@Request() req, @Body('friendId') friendId: number) {
    return this.friendsService.addFriend(req.user.id, friendId);
  }

  @UseGuards(AuthGuard)
  @Post('/remove')
  async removeFriend(@Request() req, @Body('friendId') friendId: number) {
    return this.friendsService.removeFriend(req.user.id, friendId);
  }

  @UseGuards(AuthGuard)
  @Get('/list')
  async getFriends(@Request() req) {
    return this.friendsService.getFriends(req.user.id);
  }
}

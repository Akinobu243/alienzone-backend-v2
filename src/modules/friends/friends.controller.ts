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
import { ApiTags } from '@nestjs/swagger';

@ApiTags('friends')
@Controller('/friends')
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @UseGuards(AuthGuard)
  @Post('/add')
  async addFriend(@Request() req, @Body('friendWallet') friendWallet: string) {
    return this.friendsService.addFriend(req.walletAddress, friendWallet);
  }

  @UseGuards(AuthGuard)
  @Post('/remove')
  async removeFriend(
    @Request() req,
    @Body('friendWallet') friendWallet: string,
  ) {
    return this.friendsService.removeFriend(req.walletAddress, friendWallet);
  }

  @UseGuards(AuthGuard)
  @Get('/list')
  async getFriends(@Request() req) {
    return this.friendsService.getFriends(req.walletAddress);
  }
}

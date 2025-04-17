import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('friends')
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @UseGuards(AuthGuard)
  @Post('/add')
  async addFriend(@Request() req, @Body('userIds') userIds: string[]) {
    if (!userIds || userIds.length === 0) {
      throw new BadRequestException(
        'userIds array is required and cannot be empty',
      );
    }
    return this.friendsService.addFriendsById(req.walletAddress, userIds);
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

  @UseGuards(AuthGuard)
  @Get('/search')
  async searchUsers(
    @Request() req,
    @Query('query') query: string,
    @Query('limit') limit = '10',
  ) {
    return this.friendsService.searchUsers(
      req.walletAddress,
      query,
      parseInt(limit),
    );
  }
}

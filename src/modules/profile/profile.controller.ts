import { Body, Controller, Get, Post, Query, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';

import { ProfileService } from './profile.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateAlienDTO } from './dto/profile.dto';

@ApiTags('profile')
@Controller('/profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @UseGuards(AuthGuard)
  @Get('/get-profile')
  async getProfile(@Query('walletAddress') walletAddress: string) {
    return this.profileService.getProfile(walletAddress);
  }

  @UseGuards(AuthGuard)
  @Post('/create-alien')
  @ApiBody({ type: CreateAlienDTO })
  async createAlien(
    @Body() createAlienDTO: CreateAlienDTO,
    @Request() req,
  ) {
    return this.profileService.createAlien(req.walletAddress.toLowerCase(), createAlienDTO);
  }

  @UseGuards(AuthGuard)
  @Get('/get-aliens')
  async getAliens(@Request() req) {
    return this.profileService.getAliens(req.walletAddress.toLowerCase());
  }

  @UseGuards(AuthGuard)
  @Get('/get-leaderboard')
  async getLeaderboard() {
    return this.profileService.getLeaderboard();
  }

  @Post('/update-star-balance-from-v1')
  async updateStarBalance(
    @Body('password') password: string,
    @Body('walletAddress') walletAddress: string,
    @Body('amount') amount: number,
    @Body('increment') increment: boolean = true,
  ) {
    if (password !== process.env.V1_SYNC_PASSWORD) {
      throw new UnauthorizedException('Invalid password');
    }
    return this.profileService.updateStarBalance(walletAddress, amount, increment);
  }
}

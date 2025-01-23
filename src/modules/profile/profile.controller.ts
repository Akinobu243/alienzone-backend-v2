import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';

import { ProfileService } from './profile.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateAlienDTO } from './dto/profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('profile')
@Controller('/profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @UseGuards(AuthGuard)
  @Get('/get-profile')
  @ApiQuery({ name: 'walletAddress', type: String })
  async getProfile(@Query('walletAddress') walletAddress: string) {
    return this.profileService.getProfile(walletAddress);
  }

  @UseGuards(AuthGuard)
  @Post('/create-alien')
  // @UseInterceptors(FileInterceptor('image'))
  @ApiBody({ type: CreateAlienDTO })
  async createAlien(@Body() createAlienDTO: CreateAlienDTO, @Request() req) {

    return this.profileService.createAlien(
      req.walletAddress.toLowerCase(),
      createAlienDTO,
    );
  }

  @UseGuards(AuthGuard)
  @Get('/get-aliens')
  async getAliens(@Request() req) {
    return this.profileService.getAliens(req.walletAddress.toLowerCase());
  }

  @UseGuards(AuthGuard)
  @Get('/get-characters')
  async getCharacters(@Request() req) {
    return this.profileService.getCharacters(req.walletAddress.toLowerCase());
  }

  @UseGuards(AuthGuard)
  @Get('/get-items')
  async getItems(@Request() req) {
    return this.profileService.getItems(req.walletAddress.toLowerCase());
  }

  @UseGuards(AuthGuard)
  @Get('/get-leaderboard')
  async getLeaderboard() {
    return this.profileService.getLeaderboard();
  }

  @UseGuards(AuthGuard)
  @Post('/award-daily-rewards')
  async awardDailyRewards(@Request() req) {
    return this.profileService.awardDailyRewards(req.walletAddress);
  }

  @Post('/update-star-balance-from-v1')
  async updateStarBalance(
    @Body('password') password: string,
    @Body('walletAddress') walletAddress: string,
    @Body('amount') amount: number,
  ) {
    if (password !== process.env.V1_SYNC_PASSWORD) {
      throw new UnauthorizedException('Invalid password');
    }
    amount = parseInt(amount.toString());
    return this.profileService.updateStarBalance(walletAddress, amount);
  }

  @Get('/get-all-traits')
  async getAllTraits() {
    return this.profileService.getAllTraits();
  }
}

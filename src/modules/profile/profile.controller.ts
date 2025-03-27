import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UnauthorizedException,
  UploadedFile,
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
  async getProfile(@Request() req) {
    return this.profileService.getProfile(req.walletAddress.toLowerCase());
  }

  @UseGuards(AuthGuard)
  @Post('/create-alien')
  @UseInterceptors(FileInterceptor('image'))
  async createAlien(
    @Body() createAlienDTO: CreateAlienDTO,
    @UploadedFile() image: Express.Multer.File,
    @Request() req,
  ) {
    return this.profileService.createAlien(
      req.walletAddress.toLowerCase(),
      createAlienDTO,
      image,
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
  async getLeaderboard(
    @Query('offset') offset: number,
    @Query('limit') limit: number,
    @Query('filter') filter: string,
    @Query('search') search: string,
    @Request() req,
  ) {
    if (offset === undefined) {
      offset = 0;
    }

    if (limit === undefined) {
      limit = 10;
    }

    return this.profileService.getLeaderboard(
      req.walletAddress,
      offset,
      limit,
      filter,
      search,
    );
  }

  @UseGuards(AuthGuard)
  @Post('/like-user')
  async likeUser(@Request() req, @Body('userId') userId: number) {
    return this.profileService.likeUser(req.walletAddress, userId);
  }

  @UseGuards(AuthGuard)
  @Get('/get-daily-rewards')
  async getDailyRewards(@Request() req) {
    return this.profileService.getDailyRewards(req.walletAddress);
  }

  @UseGuards(AuthGuard)
  @Get('/claim-daily-reward')
  async claimDailyReward(@Request() req) {
    return this.profileService.claimDailyReward(req.walletAddress);
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
    return this.profileService.updateStarBalanceV1(walletAddress, amount);
  }

  @Get('/get-onboarding-data')
  async getOnboardingData() {
    return this.profileService.getOnboardingData();
  }

  @UseGuards(AuthGuard)
  @UseGuards(AuthGuard)
  @Post('/use-referral-code')
  async useReferralCode(@Request() req, @Body('code') code: string) {
    return this.profileService.useReferralCode(req.walletAddress, code);
  }

  @UseGuards(AuthGuard)
  @Get('/unseen-referral-rewards')
  async getUnseenReferralRewards(@Request() req) {
    return this.profileService.getUnseenReferralRewards(req.walletAddress);
  }

  @UseGuards(AuthGuard)
  @Post('/mark-referral-rewards-seen')
  async markReferralRewardsAsSeen(@Request() req) {
    return this.profileService.markReferralRewardsAsSeen(req.walletAddress);
  }

  @UseGuards(AuthGuard)
  @Post('/use-consumable-item')
  async useConsumableItem(@Request() req, @Body('itemId') itemId: number) {
    return this.profileService.useConsumableItem(req.walletAddress, itemId);
  }

  @UseGuards(AuthGuard)
  @Post('/update-team')
  async updateTeam(
    @Request() req,
    @Body('alienIds') alienIds: number[],
    @Body('characterIds') characterIds: number[],
  ) {
    return this.profileService.updateTeam(
      req.walletAddress,
      alienIds,
      characterIds,
    );
  }

  @UseGuards(AuthGuard)
  @Get('/get-team')
  @ApiQuery({ name: 'walletAddress', type: String, required: false })
  async getTeam(@Request() req) {
    let walletAddress = req.query.walletAddress ?? req.walletAddress;
    return this.profileService.getTeam(walletAddress);
  }

  @UseGuards(AuthGuard)
  @Post('/get-equipped-alien-parts')
  async getEquippedAlienParts(
    @Request() req,
    @Body('alienId') alienId: number,
  ) {
    return this.profileService.getEquippedAlienParts(
      req.walletAddress,
      alienId,
    );
  }

  @UseGuards(AuthGuard)
  @Get('/get-owned-alien-parts')
  async getOwnedAlienParts(@Request() req) {
    return this.profileService.getOwnedAlienParts(req.walletAddress);
  }

  @UseGuards(AuthGuard)
  @Post('/equip-alien-part')
  async equipAlienPart(
    @Request() req,
    @Body('alienId') alienId: number,
    @Body('partId') partId: number,
  ) {
    return this.profileService.equipAlienPart(
      req.walletAddress,
      alienId,
      partId,
    );
  }
}

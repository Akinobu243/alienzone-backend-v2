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
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

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
    @Body() body: any,
    @UploadedFile() image: Express.Multer.File,
    @Request() req,
  ) {
    // Parse numeric fields from strings to numbers
    const createAlienDTO: CreateAlienDTO = {
      name: body.name,
      elementId: parseInt(body.elementId, 10),
      strengthPoints: body.strengthPoints,
      eyesId: parseInt(body.eyesId, 10),
      hairId: parseInt(body.hairId, 10),
      mouthId: parseInt(body.mouthId, 10),
    };

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
    const walletAddress = req.query.walletAddress ?? req.walletAddress;
    return this.profileService.getTeam(walletAddress);
  }

  @UseGuards(AuthGuard)
  @Get('/get-equipped-alien-parts')
  async getEquippedAlienParts(@Request() req) {
    const response = await this.profileService.getEquippedAlienParts(
      req.walletAddress,
      req.alienId,
    );

    if (response.success) {
      return response.parts;
    } else {
      return response;
    }
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
    @Body('parts') parts: { type: string; id: number }[],
  ) {
    return this.profileService.equipAlienPart(
      req.walletAddress,
      alienId,
      parts,
    );
  }

  // @UseGuards(AuthGuard)
  // @Post('/equip-alien-part')
  // async equipAlienPart(
  //   @Request() req,
  //   @Body('alienId') alienId: number,
  //   @Body('partIds') partIds: number[],
  // ) {
  //   return this.profileService.equipAlienPart(
  //     req.walletAddress,
  //     alienId,
  //     partIds,
  //   );
  // }

  @UseGuards(AuthGuard)
  @Post('/update-alien-image')
  @UseInterceptors(FileInterceptor('image'))
  async updateAlienImage(
    @Body('alienId') alienId: number,
    @UploadedFile() image: Express.Multer.File,
    @Request() req,
  ) {
    console.log('updateAlienImage', req.walletAddress, alienId, image);

    const walletAddress = req.walletAddress.toLowerCase();
    return this.profileService.updateAlienImage(walletAddress, alienId, image);
  }

  @ApiOperation({ summary: 'Get forgeable alien parts and user rune amounts' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved forgeable parts and rune amounts',
    schema: {
      example: {
        success: true,
        alienParts: [
          {
            id: 1,
            name: 'Alien Part A',
            description: 'A powerful alien part.',
            power: 50,
            type: 'HEAD',
            image: 'https://example.com/alien-part-a.png',
            forgeRuneType: 'COMMON',
            forgeRuneAmount: 5,
          },
          {
            id: 2,
            name: 'Alien Part B',
            description: 'Another powerful alien part.',
            power: 70,
            type: 'BODY',
            image: 'https://example.com/alien-part-b.png',
            forgeRuneType: 'RARE',
            forgeRuneAmount: 3,
          },
        ],
        userRuneAmounts: {
          COMMON: 10,
          RARE: 5,
          EPIC: 2,
          LEGENDARY: 1,
        },
      },
    },
  })
  @UseGuards(AuthGuard)
  @Get('/get-forge-parts')
  async getForgeParts(@Request() req) {
    return this.profileService.getForgeParts(req.walletAddress.toLowerCase());
  }

  @UseGuards(AuthGuard)
  @Post('/forge-parts')
  async forgeParts(@Request() req, @Body('alienPartId') alienPartId: number) {
    return this.profileService.forgeParts(
      req.walletAddress.toLowerCase(),
      alienPartId,
    );
  }

  @UseGuards(AuthGuard)
  @Get('/get-default-alien-parts')
  async getDefaultAlienParts(@Request() req) {
    return this.profileService.getDefaultAlienParts(
      req.walletAddress.toLowerCase(),
    );
  }

  @UseGuards(AuthGuard)
  @Post('/enhance-parts')
  async enhanceParts(@Request() req, @Body('alienPartId') alienPartId: number) {
    return this.profileService.enhanceParts(
      req.walletAddress.toLowerCase(),
      alienPartId,
    );
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { QuestService } from './quest.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('quests')
@Controller('quests')
export class QuestController {
  constructor(private readonly questService: QuestService) {}

  @UseGuards(AuthGuard)
  @Get('/list')
  @ApiOperation({ summary: 'List all quests with user progress' })
  @ApiResponse({ status: 200, description: 'Returns all quests with progress' })
  async listQuests(@Request() req) {
    return this.questService.listQuests(req.walletAddress.toLowerCase());
  }

  @UseGuards(AuthGuard)
  @Post('/claim-rewards')
  @ApiOperation({ summary: 'Claim rewards for a completed quest' })
  @ApiResponse({ status: 200, description: 'Rewards claimed successfully' })
  async claimRewards(@Request() req, @Body('questId') questId: number) {
    return this.questService.claimRewards(
      req.walletAddress.toLowerCase(),
      questId,
    );
  }

  @UseGuards(AuthGuard)
  @Post('/progress-volume')
  @ApiOperation({ summary: 'Update volume quest progress for a user' })
  @ApiResponse({ status: 200, description: 'Volume quest progress updated' })
  async progressVolumeQuest(
    @Request() req,
    @Body('zoneVolume') zoneVolume: number,
  ) {
    return this.questService.progressVolumeQuest(
      req.walletAddress.toLowerCase(),
      zoneVolume,
    );
  }
}

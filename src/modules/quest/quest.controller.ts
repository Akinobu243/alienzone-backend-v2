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

@ApiTags('quest')
@Controller('quest')
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
}

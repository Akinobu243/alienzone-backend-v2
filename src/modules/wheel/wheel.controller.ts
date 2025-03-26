import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WheelService } from './wheel.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@ApiTags('wheel')
@Controller('wheel')
export class WheelController {
  constructor(private readonly wheelService: WheelService) {}

  @UseGuards(AuthGuard)
  @Get('/spin')
  @ApiOperation({ summary: 'Spin the wheel' })
  @ApiResponse({
    status: 200,
    description: 'Returns the result of the wheel spin',
  })
  async spinWheel(@Request() req) {
    return this.wheelService.spinWheel(req.walletAddress.toLowerCase());
  }

  @UseGuards(AuthGuard)
  @Get('/can-spin')
  @ApiOperation({ summary: 'Check if the user can spin the wheel' })
  @ApiResponse({
    status: 200,
    description: 'Returns whether the user can spin the wheel',
  })
  async canSpin(@Request() req) {
    return this.wheelService.canSpin(req.walletAddress.toLowerCase());
  }

  @UseGuards(AuthGuard)
  @Get('/spin-history')
  @ApiOperation({ summary: 'Get user spin history' })
  @ApiResponse({
    status: 200,
    description: 'Returns the times the user spun the wheel',
  })
  async getSpinHistory(@Request() req) {
    return this.wheelService.getSpinHistory(req.walletAddress.toLowerCase());
  }

  @Get('/rewards')
  @ApiOperation({ summary: 'Get all possible rewards' })
  @ApiResponse({
    status: 200,
    description: 'Returns all possible rewards',
  })
  async getRewards() {
    return this.wheelService.getRewards();
  }
}

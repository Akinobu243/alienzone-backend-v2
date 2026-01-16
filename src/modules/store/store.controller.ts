import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';

@ApiTags('store')
@Controller('/store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @UseGuards(AdminGuard)
  @Post('/update-wearables')
  @ApiBody({
    description: 'Update wearables metadata',
    schema: {
      type: 'object',
      properties: {
        useLocalMetadata: {
          type: 'boolean',
          description:
            'Use local metadata instead of fetching from the production API',
          default: false,
        },
      },
      required: [],
    },
  })
  async updateWearables(
    @Body('useLocalMetadata') useLocalMetadata: boolean = false,
  ) {
    return this.storeService.updateWearables(useLocalMetadata);
  }

  @UseGuards(AuthGuard)
  @Get('/wearables')
  async getWearables(@Request() req) {
    return this.storeService.getWearables();
  }

  @UseGuards(AuthGuard)
  @Get('/wearables-optimized')
  async getWearablesOptimized(@Request() req) {
    return this.storeService.getWearablesOptimized();
  }

  @UseGuards(AuthGuard)
  @Get('/wearables/:subject')
  async getWearableDetails(@Param('subject') subject: string, @Request() req) {
    return this.storeService.getWearableDetails(
      subject,
      req.walletAddress.toLowerCase(),
    );
  }

  @UseGuards(AuthGuard)
  @ApiBody({
    description: 'Progress a quest for the user',
    schema: {
      type: 'object',
      properties: {
        subject: {
          type: 'string',
          description: 'The subject of the bought wearable',
        },
      },
      required: ['subject'],
    },
  })
  @Post(`/wearables/bought-quest`)
  async progressBoughtQuest(@Body('subject') subject: string, @Request() req) {
    return this.storeService.progressBoughtQuest(
      subject,
      req.walletAddress.toLowerCase(),
    );
  }
}

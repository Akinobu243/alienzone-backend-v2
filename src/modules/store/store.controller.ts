import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('store')
@Controller('/store')
export class StoreController {
  constructor(
    private readonly storeService: StoreService,
    private readonly prisma: PrismaService,
  ) {}

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
  @ApiQuery({ name: 'sort', required: false, type: String, description: 'Sort order: all, trending, newest' })
  @ApiQuery({ name: 'rarity', required: false, type: String, description: 'Filter by rarity: COMMON, UNCOMMON, RARE, EPIC, LEGENDARY' })
  async getWearables(
    @Request() req,
    @Query('sort') sort?: string,
    @Query('rarity') rarity?: string,
  ) {
    if (sort || rarity) {
      return this.storeService.getWearablesWithFilters(
        sort,
        rarity,
        req.walletAddress?.toLowerCase(),
      );
    }
    return this.storeService.getWearables();
  }

  @UseGuards(AuthGuard)
  @Get('/wearables-optimized')
  async getWearablesOptimized(@Request() req) {
    return this.storeService.getWearablesOptimized();
  }

  // Static paths MUST come before :subject to avoid NestJS matching them as params
  @UseGuards(AuthGuard)
  @Get('/wearables/unlocked')
  async getUserUnlockedWearables(@Request() req) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: req.walletAddress.toLowerCase() },
    });
    if (!user) return [];
    return this.storeService.getUserUnlockedWearables(user.id);
  }

  @UseGuards(AuthGuard)
  @Post('/wearables/unlock-with-stars')
  @ApiBody({
    description: 'Unlock a non-Common wearable for trading using Stars',
    schema: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'The wearable subject identifier' },
      },
      required: ['subject'],
    },
  })
  async unlockWithStars(@Body('subject') subject: string, @Request() req) {
    return this.storeService.unlockWithStars(
      subject,
      req.walletAddress.toLowerCase(),
    );
  }

  // Dynamic :subject routes below
  @UseGuards(AuthGuard)
  @Get('/wearables/:subject')
  async getWearableDetails(@Param('subject') subject: string, @Request() req) {
    return this.storeService.getWearableDetails(
      subject,
      req.walletAddress.toLowerCase(),
    );
  }

  @UseGuards(AuthGuard)
  @Get('/wearables/:subject/activity')
  async getWearableActivity(
    @Param('subject') subject: string,
    @Query('limit') limit?: number,
  ) {
    return this.storeService.getWearableActivity(subject, limit ? Number(limit) : 20);
  }

  @UseGuards(AuthGuard)
  @Get('/wearables/:subject/volume')
  async getWearableVolume(@Param('subject') subject: string) {
    const volume = await this.storeService.get7DayVolume(subject);
    return { subject, volume7d: volume };
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

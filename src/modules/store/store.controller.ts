import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { StoreService } from './store.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ApiBody, ApiTags } from '@nestjs/swagger';

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

  @Get('/wearables')
  async getWearables() {
    return this.storeService.getWearables();
  }

  @Get('/wearables/:subject')
  async getWearableDetails(@Param('subject') subject: string) {
    return this.storeService.getWearableDetails(subject);
  }

  @Get('/wearables/user-wearables/:address')
  async getUserWearables(@Param('address') address: string) {
    return this.storeService.getUserWearables(address);
  }
}

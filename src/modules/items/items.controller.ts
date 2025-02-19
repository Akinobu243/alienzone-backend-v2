import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ItemsService } from './items.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { SetDailyRewardDto } from './dto/daily-rewards.dto';
import { ItemQuality, ItemType } from '@prisma/client';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @UseGuards(AdminGuard)
  @Post('/create-item')
  async createItem(
    @Body('type') type: string,
    @Body('quality') quality: string,
    @Body('description') description: string,
    @Body('image') image: string,
  ) {
    const itemType = type as ItemType;
    const itemQuality = quality as ItemQuality;
    return this.itemsService.createItem(itemType, itemQuality, description, image);
  }

  @UseGuards(AdminGuard)
  @Post('/edit-item')
  async editItem(
    @Body('id') id: number,
    @Body('type') type: string,
    @Body('quality') quality: string,
    @Body('description') description: string,
    @Body('image') image: string,
  ) {
    const itemType = type as ItemType;
    const itemQuality = quality as ItemQuality;
    return this.itemsService.editItem(id, itemType, itemQuality, description, image);
  }

  @UseGuards(AdminGuard)
  @Post('/delete-item')
  async deleteItem(@Body('id') id: number) {
    return this.itemsService.deleteItem(id);
  }
  
  @UseGuards(AdminGuard)
  @Get('/get-all-items')
  async getAllItems(
    @Body('page') page: number = 1,
    @Body('limit') limit: number = 10,
  ) {
    return this.itemsService.getAllItems(page, limit);
  }

  @UseGuards(AdminGuard)
  @Post('/set-daily-rewards')
  async setDailyRewards(
    @Body('rewards') rewards: SetDailyRewardDto[],
  ) {
    return this.itemsService.setDailyRewards(rewards);
  }

}
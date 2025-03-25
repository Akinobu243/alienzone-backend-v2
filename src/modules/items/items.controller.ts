import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Request,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { SetDailyRewardDto } from './dto/daily-rewards.dto';
import { ItemQuality, ItemType } from '@prisma/client';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @UseGuards(AdminGuard)
  @Post('/create-item')
  async createItem(
    @Body('type') type: ItemType,
    @Body('quality') quality: ItemQuality,
    @Body('description') description: string,
    @Body('image') image: string,
  ) {
    return this.itemsService.createItem(type, quality, description, image);
  }

  @UseGuards(AdminGuard)
  @Post('/edit-item')
  async editItem(
    @Body('id') id: number,
    @Body('type') type: ItemType,
    @Body('quality') quality: ItemQuality,
    @Body('description') description: string,
    @Body('image') image: string,
  ) {
    return this.itemsService.editItem(id, type, quality, description, image);
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
  async setDailyRewards(@Body('rewards') rewards: SetDailyRewardDto[]) {
    return this.itemsService.setDailyRewards(rewards);
  }

  @UseGuards(AdminGuard)
  @Get('/get-daily-rewards')
  async getDailyRewards() {
    return this.itemsService.getDailyRewards();
  }
}

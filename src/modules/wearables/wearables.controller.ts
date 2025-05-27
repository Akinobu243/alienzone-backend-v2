import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { WearablesService } from './wearables.service';

@Controller('wearables')
export class WearablesController {
  constructor(private readonly wearablesService: WearablesService) {}

  @Get(':id.json')
  async getWearableMetadata(@Param('id') id: string) {
    const metadata = await this.wearablesService.getMetadataById(id);
    if (!metadata) {
      throw new NotFoundException('Wearable metadata not found');
    }
    return metadata;
  }
}

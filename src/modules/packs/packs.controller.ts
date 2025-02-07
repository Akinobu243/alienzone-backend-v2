import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { PacksService } from './packs.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';

@ApiTags('packs')
@Controller('packs')
export class PacksController {
  constructor(private readonly packsService: PacksService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all active packs' })
  @ApiResponse({
    status: 200,
    description: 'Returns all active packs with their rewards',
  })
  async getAllPacks() {
    return this.packsService.getAllPacks();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pack by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the pack with specified ID',
  })
  @ApiResponse({ status: 404, description: 'Pack not found' })
  async getPackById(@Param('id', ParseIntPipe) id: number) {
    return this.packsService.getPackById(id);
  }

  @Get('default/all')
  @ApiOperation({ summary: 'Get all default (free) packs' })
  @ApiResponse({ status: 200, description: 'Returns all default packs' })
  async getDefaultPacks() {
    return this.packsService.getDefaultPacks();
  }
}

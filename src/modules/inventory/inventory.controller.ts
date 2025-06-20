import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { InventoryService } from './inventory.service';
import { InventoryResponseDto } from './dto/inventory.dto';

@ApiTags('inventory')
@Controller('/inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @UseGuards(AuthGuard)
  @Get('/get-user-inventory')
  @ApiOperation({
    summary: 'Get all inventory items for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns all inventory items including characters, elements, alien parts, aliens, and items',
    type: InventoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserInventory(@Request() req) {
    return this.inventoryService.getUserInventory(
      req.walletAddress.toLowerCase(),
    );
  }

  @UseGuards(AuthGuard)
  @Get('/get-store-inventory')
  @ApiQuery({ name: 'walletAddress', required: false, type: String })
  @ApiOperation({
    summary: 'Get all inventory items for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns all inventory items including characters, elements, alien parts, aliens, and items',
    type: InventoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStoreInventory(
    @Request() req,
    @Query('walletAddress') queryWalletAddress?: string,
  ) {
    const walletAddress = (
      queryWalletAddress || req.walletAddress
    ).toLowerCase();

    return this.inventoryService.getStoreInventory(walletAddress);
  }
}

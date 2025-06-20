import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  async getStoreInventory(@Request() req) {
    return this.inventoryService.getStoreInventory(
      req.walletAddress.toLowerCase(),
    );
  }
}

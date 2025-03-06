import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { InventoryService } from './inventory.service';
import { UserInventoryResponseDto } from './dto/inventory.dto';

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
    type: UserInventoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserInventory(@Request() req): Promise<UserInventoryResponseDto> {
    return this.inventoryService.getUserInventory(
      req.walletAddress.toLowerCase(),
    );
  }
}

import { ApiProperty } from '@nestjs/swagger';

export class InventoryResponseDto {
  @ApiProperty({ description: 'Item ID' })
  id: number;

  @ApiProperty({ description: 'Item name' })
  name: string;

  @ApiProperty({ description: 'Item quantity' })
  quantity: number;

  @ApiProperty({ description: 'Item image' })
  image: string;

  @ApiProperty({ description: 'Item description' })
  description?: string;

  @ApiProperty({ description: 'Item type' })
  type: 'CHARACTER' | 'ELEMENT' | 'ALIEN_PART' | 'GEAR';
}

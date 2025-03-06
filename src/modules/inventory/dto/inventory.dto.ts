import { ApiProperty } from '@nestjs/swagger';
import { CharacterRarity } from '@prisma/client';

export class UserInfoDto {
  @ApiProperty({ description: 'User ID' })
  id: number;

  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiProperty({ description: 'User wallet address' })
  walletAddress: string;

  @ApiProperty({ description: 'User level' })
  level: number;

  @ApiProperty({ description: 'User experience points' })
  experience: number;

  @ApiProperty({ description: 'User reputation' })
  reputation: number;

  @ApiProperty({ description: 'User stars' })
  stars: number;
}

export class ElementDto {
  @ApiProperty({ description: 'Element ID' })
  id: number;

  @ApiProperty({ description: 'Element name' })
  name: string;

  @ApiProperty({ description: 'Element type (placeholder)' })
  type: string;

  @ApiProperty({ description: 'Element image URL', required: false })
  image?: string;
}

export class CharacterDto {
  @ApiProperty({ description: 'Character ID' })
  id: number;

  @ApiProperty({ description: 'User Character ID' })
  userCharacterId: number;

  @ApiProperty({ description: 'Character name' })
  name: string;

  @ApiProperty({ description: 'Character rarity' })
  rarity: CharacterRarity;

  @ApiProperty({ description: 'Character power' })
  power: number;

  @ApiProperty({ description: 'Character image URL', required: false })
  image?: string;

  @ApiProperty({ description: 'Character video URL', required: false })
  video?: string;

  @ApiProperty({ description: 'Character portal' })
  portal: number;

  @ApiProperty({ description: 'Character element' })
  element: ElementDto;

  @ApiProperty({ description: 'Quantity owned' })
  quantity: number;

  @ApiProperty({ description: 'Whether character is in raid' })
  inRaid: boolean;

  @ApiProperty({ description: 'Whether character is on team' })
  onTeam: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class AlienDto {
  @ApiProperty({ description: 'Alien ID' })
  id: number;

  @ApiProperty({ description: 'Alien name' })
  name: string;

  @ApiProperty({ description: 'Alien image URL', required: false })
  image?: string;

  @ApiProperty({ description: 'Alien strength points' })
  strengthPoints: number;

  @ApiProperty({ description: 'Whether alien is in raid' })
  inRaid: boolean;

  @ApiProperty({ description: 'Whether alien is on team' })
  onTeam: boolean;

  @ApiProperty({ description: 'Whether alien is selected' })
  selected: boolean;

  @ApiProperty({ description: 'Alien element' })
  element: ElementDto;
}

export class ItemDto {
  @ApiProperty({ description: 'Item ID' })
  id: number;

  @ApiProperty({ description: 'Item name (derived from type)' })
  name: string;

  @ApiProperty({ description: 'Item description' })
  description: string;

  @ApiProperty({ description: 'Item image URL', required: false })
  image?: string;

  @ApiProperty({ description: 'Item quantity' })
  quantity: number;
}

export class AlienPartGroupDto {
  @ApiProperty({ description: 'Alien part group ID' })
  id: number;

  @ApiProperty({ description: 'Alien part group name' })
  name: string;
}

export class AlienPartDto {
  @ApiProperty({ description: 'Alien part ID' })
  id: number;

  @ApiProperty({ description: 'Alien part name' })
  name: string;

  @ApiProperty({ description: 'Alien part image URL', required: false })
  image?: string;

  @ApiProperty({ description: 'Alien part group', required: false })
  group: AlienPartGroupDto | null;
}

export class InventoryDto {
  @ApiProperty({
    description: 'Characters owned by the user',
    type: [CharacterDto],
  })
  characters: CharacterDto[];

  @ApiProperty({
    description: 'Elements owned by the user',
    type: [ElementDto],
  })
  elements: ElementDto[];

  @ApiProperty({
    description: 'Alien parts owned by the user',
    type: [AlienPartDto],
  })
  alienParts: AlienPartDto[];

  @ApiProperty({ description: 'Aliens owned by the user', type: [AlienDto] })
  aliens: AlienDto[];

  @ApiProperty({ description: 'Items owned by the user', type: [ItemDto] })
  items: ItemDto[];
}

export class UserInventoryResponseDto {
  @ApiProperty({ description: 'User information' })
  user: UserInfoDto;

  @ApiProperty({ description: 'User inventory' })
  inventory: InventoryDto;
}

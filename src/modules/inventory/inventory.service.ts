import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserInventoryResponseDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all inventory items for a user including characters, elements, and alien parts
   */
  public async getUserInventory(
    walletAddress: string,
  ): Promise<UserInventoryResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
      include: {
        aliens: {
          include: {
            element: true,
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Get user characters with their details
    const userCharacters = await this.prisma.userCharacter.findMany({
      where: {
        userId: user.id,
      },
      include: {
        character: {
          include: {
            element: true,
          },
        },
      },
    });

    // Get user elements
    const userElements = await this.prisma.userElement.findMany({
      where: {
        userId: user.id,
      },
      include: {
        element: true,
      },
    });

    // Get alien parts - since AlienPart has a many-to-many relationship with User
    const alienParts = await this.prisma.alienPart.findMany({
      where: {
        users: {
          some: {
            id: user.id,
          },
        },
      },
      include: {
        AlienPartGroup: true,
      },
    });

    // Get user items
    const userItems = await this.prisma.userItem.findMany({
      where: {
        userId: user.id,
      },
      include: {
        item: true,
      },
    });

    // Format the characters to include quantity and other details
    const formattedCharacters = userCharacters.map((userChar) => ({
      id: userChar.character.id,
      userCharacterId: userChar.id,
      name: userChar.character.name,
      rarity: userChar.character.rarity,
      power: userChar.character.power,
      image: userChar.character.image,
      video: userChar.character.video,
      portal: userChar.character.portal,
      element: {
        id: userChar.character.element.id,
        name: userChar.character.element.name,
        // Using a placeholder for type since it's required by the DTO
        type: 'FIRE',
        image: userChar.character.element.image,
      },
      quantity: userChar.quantity,
      inRaid: userChar.inRaid,
      onTeam: userChar.onTeam,
      createdAt: userChar.createdAt,
      updatedAt: userChar.updatedAt,
    }));

    // Format elements
    const formattedElements = userElements.map((userElem) => ({
      id: userElem.element.id,
      name: userElem.element.name,
      // Using a placeholder for type since it's required by the DTO
      type: 'FIRE',
      image: userElem.element.image,
    }));

    // Format alien parts
    const formattedAlienParts = alienParts.map((part) => ({
      id: part.id,
      name: part.name,
      image: part.image,
      group: part.AlienPartGroup.length > 0 ? part.AlienPartGroup[0] : null,
    }));

    // Format aliens
    const formattedAliens = user.aliens.map((alien) => ({
      id: alien.id,
      name: alien.name,
      image: alien.image,
      strengthPoints: alien.strengthPoints,
      inRaid: alien.inRaid,
      onTeam: alien.onTeam,
      selected: alien.selected,
      element: {
        id: alien.element.id,
        name: alien.element.name,
        // Using a placeholder for type since it's required by the DTO
        type: 'FIRE',
        image: alien.element.image,
      },
    }));

    // Format items
    const formattedItems = userItems.map((userItem) => ({
      id: userItem.item.id,
      // Using item type as name since Item doesn't have a name field
      name: String(userItem.item.type),
      description: userItem.item.description,
      image: userItem.item.image,
      quantity: userItem.quantity,
    }));

    return {
      user: {
        id: user.id,
        name: user.name,
        walletAddress: user.walletAddress,
        level: user.level,
        experience: user.experience,
        reputation: user.reputation,
        stars: user.stars,
      },
      inventory: {
        characters: formattedCharacters,
        elements: formattedElements,
        alienParts: formattedAlienParts,
        aliens: formattedAliens,
        items: formattedItems,
      },
    };
  }
}

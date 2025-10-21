import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryResponseDto } from './dto/inventory.dto';
import { CharacterService } from '../character/character.service';
import { StoreService } from '../store/store.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private characterService: CharacterService,
    private storeSevice: StoreService,
  ) {}

  /**
   * Get all inventory items for a user including characters, elements, and alien parts
   */
  public async getUserInventory(walletAddress: string) {
    try {
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
      const userCharacters = (
        await this.characterService.getUserCharacters(walletAddress)
      ).userCharacters;

      // Get user elements
      const userElements = await this.prisma.userElement.findMany({
        where: {
          userId: user.id,
        },
        include: {
          element: true,
        },
      });

      // // Get alien parts - since AlienPart has a many-to-many relationship with User
      // const alienParts = await this.prisma.alienPart.findMany({
      //   where: {
      //     users: {
      //       some: {
      //         id: user.id,
      //       },
      //     },
      //   },
      //   include: {
      //     AlienPartGroup: true,
      //   },
      // });

      const wearableAlienParts = await this.storeSevice.getUserWearables(
        walletAddress.toLowerCase(),
      );

      const alienPartGroup = await this.prisma.alienPartGroup.findMany({
        where: {
          userId: user.id,
        },
        include: {
          parts: true,
        },
      });

      let alienParts = [];

      for (const group of alienPartGroup) {
        if (group.parts) {
          alienParts = [...alienParts, ...group.parts];
        }
      }

      for (const wearable of wearableAlienParts) {
        if (wearable.alienPart) {
          alienParts.push({ ...wearable.alienPart, balance: wearable.balance });
        }
      }

      // Get user gear items
      const userGearItems = await this.prisma.userGearItem.findMany({
        where: {
          userId: user.id,
        },
        include: {
          gearItem: true,
        },
      });

      const userRunes = Object.values(
        user.runes
          .filter((rune) => rune.toLowerCase() !== 'legendary') // remove 'legendary'
          .reduce((acc, rune) => {
            if (!acc[rune]) {
              acc[rune] = {
                id: Object.keys(acc).length,
                name: rune,
                quantity: 1,
                image: '',
                description: '',
                type: 'RUNE',
              };
            } else {
              acc[rune].quantity += 1;
            }
            return acc;
          }, {}),
      );

      console.log('user Runes ', userRunes);

      // Get user items
      const userItems = await this.prisma.userItem.findMany({
        where: {
          userId: user.id,
        },
        include: {
          item: true,
        },
      });

      const formattedItems = userItems.map((userItem) => ({
        id: userItem.item.id,
        name: `${userItem.item.quality} ${userItem.item.type}`,
        quantity: userItem.quantity,
        image: userItem.item.image,
        description: userItem.item.description,
        type: 'CONSUMABLE' as const,
      }));

      // Format the characters to match InventoryGroupsDto
      const formattedCharacters = userCharacters.map((userChar) => {
        return {
          id: userChar.id,
          name: userChar.name,
          quantity: userChar.quantity,
          tier: userChar.tier,
          isPortal2: userChar.isPortal2,
          image: userChar.image,
          description: `${userChar.rarity} character with power ${userChar.power}`,
          upgradesToId: userChar.upgradesToId,
          type: 'CHARACTER' as const,
        };
      });

      // Format elements to match InventoryGroupsDto
      const formattedElements = userElements.map((userElem) => ({
        id: userElem.element.id,
        name: userElem.element.name,
        quantity: 1, // Assuming each element is counted as 1
        image: userElem.element.image,
        description: `Element type: ${userElem.element.name}`,
        type: 'ELEMENT' as const,
      }));

      // // Format alien parts to match InventoryGroupsDto
      // const formattedAlienParts = alienParts.map((part) => ({
      //   id: part.id,
      //   name: part.name,
      //   quantity: 1, // Assuming each alien part is counted as 1
      //   image: part.image,
      //   description:
      //     part.AlienPartGroup.length > 0
      //       ? part.AlienPartGroup[0].description
      //       : '',
      //   type: 'ALIEN_PART' as const,
      // }));

      const formattedAlienParts = alienParts.map((part) => ({
        id: part.id,
        name: part.name,
        quantity: part.balance || 1,
        image: part.image,
        description: part.description,
        type: 'ALIEN_PART' as const,
      }));

      // Format gear items to match InventoryGroupsDto
      const formattedGearItems = userGearItems.map((userGear) => ({
        id: userGear.gearItem.id,
        name: `${userGear.gearItem.type} Gear`,
        quantity: userGear.quantity,
        image: userGear.gearItem.image,
        description: `${userGear.gearItem.rarity} gear item`,
        type: 'GEAR' as const,
      }));

      return [
        ...formattedItems,
        ...formattedCharacters,
        ...formattedElements,
        ...formattedAlienParts,
        ...formattedGearItems,
        ...userRunes,
      ];
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  public async getStoreInventory(walletAddress: string) {
    try {
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

      const wearableAlienParts = await this.storeSevice.getUserWearables(
        walletAddress.toLowerCase(),
      );

      const alienPartGroup = await this.prisma.alienPartGroup.findMany({
        where: {
          userId: user.id,
        },
        include: {
          parts: true,
        },
      });

      let alienParts = [];

      for (const group of alienPartGroup) {
        if (group.parts) {
          alienParts = [...alienParts, ...group.parts];
        }
      }

      for (const wearable of wearableAlienParts) {
        if (wearable.alienPart) {
          alienParts.push(wearable.alienPart);
        }
      }

      const formattedAlienParts = alienParts.map((part) => ({
        id: part.id,
        name: part.name,
        quantity: part.balance || 1,
        image: part.image,
        description: part.description,
        rarity: part.rarity,
        price: part.price,
        type: part.type,
      }));

      return [...formattedAlienParts];
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }
}

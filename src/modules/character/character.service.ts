import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CharacterRarity, Element } from '@prisma/client';

@Injectable()
export class CharacterService {
  constructor(private prisma: PrismaService) {}

  public async createCharacter(
    name: string,
    element: Element,
    rarity: CharacterRarity,
    power: number,
    image: string,
    portal: number,
  ) {
    await this.prisma.character.create({
      data: {
        name,
        element,
        rarity,
        power,
        image,
        portal,
      },
    });
  }

  public async editCharacter(
    id: number,
    name?: string,
    level?: number,
    element?: Element,
    strengthPoints?: number,
    image?: string,
    portal?: number,
  ) {
    await this.prisma.character.update({
      where: {
        id: id,
      },
      data: {
      ...(name && { name }),
      ...(level && { level }),
      ...(element && { element }),
      ...(strengthPoints && { strengthPoints }),
      ...(image && { image }),
      ...(portal && { portal }),
      },
    });
  }

  public async deleteCharacter(id: number) {
    await this.prisma.character.delete({
      where: {
        id: id,
      },
    });
  }

  public async getAllCharacters() {
    return await this.prisma.character.findMany();
  }

  public async rewardCharacter(walletAddress: string, portal: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    if (user.stars < 100) {
      throw new Error('Insufficient balance');
    }

    const characters = await this.prisma.character.findMany({
      where: {
        portal,
      },
    });
    const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
    // TODO: reward character based on rarity from smart contract

    // Create the user character
    await this.prisma.userCharacter.create({
      data: {
        user: {
          connect: {
            id: user.id,
          },
        },
        character: {
          connect: {
            id: randomCharacter.id,
          },
        },
      },
    });

    await this.prisma.user.update({
      where: {
        walletAddress,
      },
      data: {
        stars: {
          decrement: 100,
        },
      },
    });
  }

  public async getUserCharacters(walletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
      include: {
        characters: true,
      },
    });

    var userCharacters = user.characters.map(async (char) => {
      return await this.prisma.character.findUnique({
        where: {
          id: char.characterId,
        },
      });
    });

    return userCharacters;
  }
}

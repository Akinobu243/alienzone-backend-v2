import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CharacterService {
  constructor(private prisma: PrismaService) {}

  public async createCharacter(
    name: string,
    level: number,
    element: string,
    strengthPoints: number,
    image: string,
  ) {
    await this.prisma.character.create({
      data: {
        name,
        level,
        element,
        strengthPoints,
        image,
      },
    });
  }

  public async editCharacter(
    id: number,
    name?: string,
    level?: number,
    element?: string,
    strengthPoints?: number,
    image?: string,
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

  public async rewardCharacter(walletAddress: string) {
    // Choose a random character to reward
    const characters = await this.prisma.character.findMany();
    const randomCharacter = characters[Math.floor(Math.random() * characters.length)];

    // Find the user
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

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

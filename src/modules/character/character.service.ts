import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CharacterRarity } from '@prisma/client';

@Injectable()
export class CharacterService {
  constructor(private prisma: PrismaService) {}

  public async createCharacter(
    name: string,
    elementId: number,
    rarity: CharacterRarity,
    power: number,
    image: string,
    portal: number,
  ) {
    const element = await this.prisma.element.findUnique({
      where: {
        id: elementId,
      },
    });
    if (!element) {
      throw new BadRequestException('Element not found');
    }
    await this.prisma.character.create({
      data: {
        name,
        element: {
          connect: {
            id: elementId,
          },
        },
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
    elementId?: number,
    power?: number,
    image?: string,
    portal?: number,
  ) {
    if (elementId) {
      const element = await this.prisma.element.findUnique({
        where: {
          id: elementId,
        },
      });
      if (!element) {
        throw new BadRequestException('Element not found');
      }
    }
    await this.prisma.character.update({
      where: {
        id: id,
      },
      data: {
        ...(name && { name }),
        ...(elementId && { element: { connect: { id: elementId } } }),
        ...(power && { power }),
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
      throw new BadRequestException(
        'Insufficient stars balance. Required: 100 stars',
      );
    }

    const characters = await this.prisma.character.findMany({
      where: {
        portal,
      },
    });
    const randomCharacter =
      characters[Math.floor(Math.random() * characters.length)];
    // TODO: reward character based on rarity from smart contract

    // Check if user already has this character
    const existingUserCharacter = await this.prisma.userCharacter.findFirst({
      where: {
        userId: user.id,
        characterId: randomCharacter.id,
      },
    });

    if (existingUserCharacter) {
      // Increment quantity if user already has this character
      await this.prisma.userCharacter.update({
        where: {
          id: existingUserCharacter.id,
        },
        data: {
          quantity: {
            increment: 1,
          },
        },
      });
    } else {
      // Create new user character record if user doesn't have this character yet
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
          quantity: 1,
        },
      });
    }

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

    return {
      success: true,
      character: randomCharacter,
    };
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

    const userCharacters = await Promise.all(
      user.characters.map(async (userChar) => {
        const character = await this.prisma.character.findUnique({
          where: {
            id: userChar.characterId,
          },
          include: {
            element: true,
          },
        });

        return {
          ...character,
          quantity: userChar.quantity,
          inRaid: userChar.inRaid,
          onTeam: userChar.onTeam,
          userCharacterId: userChar.id,
        };
      }),
    );

    return userCharacters;
  }

  public async multiSummonCharacters(walletAddress: string, portal: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.stars < 1000) {
      throw new BadRequestException(
        'Insufficient stars balance. Required: 1000 stars',
      );
    }

    const characters = await this.prisma.character.findMany({
      where: {
        portal,
      },
      include: {
        element: true,
      },
    });

    if (characters.length === 0) {
      throw new BadRequestException('No characters found for this portal');
    }

    const rewardedCharacters = [];
    const summonResults = [];

    // Reward 10 random characters
    for (let i = 0; i < 10; i++) {
      const randomCharacter =
        characters[Math.floor(Math.random() * characters.length)];

      // Check if user already has this character
      const existingUserCharacter = await this.prisma.userCharacter.findFirst({
        where: {
          userId: user.id,
          characterId: randomCharacter.id,
        },
      });

      if (existingUserCharacter) {
        // Increment quantity if user already has this character
        await this.prisma.userCharacter.update({
          where: {
            id: existingUserCharacter.id,
          },
          data: {
            quantity: {
              increment: 1,
            },
          },
        });
      } else {
        // Create new user character record if user doesn't have this character yet
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
            quantity: 1,
          },
        });
      }

      rewardedCharacters.push(randomCharacter);
      summonResults.push({
        character: randomCharacter,
        isNew: !existingUserCharacter,
      });
    }

    // Deduct stars from user
    await this.prisma.user.update({
      where: {
        walletAddress,
      },
      data: {
        stars: {
          decrement: 1000,
        },
      },
    });

    return {
      success: true,
      summonResults,
    };
  }
}

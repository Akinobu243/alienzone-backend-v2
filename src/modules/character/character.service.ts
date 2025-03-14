import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import {
  CharacterRarity,
  CharacterTransactionType,
  TransactionStatus,
} from '@prisma/client';
import { ethers } from 'ethers';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CharacterService {
  constructor(private prisma: PrismaService) {}
  private contractAddress = process.env.CONTRACT_ADDRESS;
  private provider = new ethers.JsonRpcProvider(process.env.RPC_PROVIDER);
  private adminWallet = new ethers.Wallet(
    process.env.ADMIN_PRIVATE_KEY,
    this.provider,
  );

  public async createCharacter(
    name: string,
    elementId: number,
    rarity: CharacterRarity,
    power: number,
    image: string,
    tier: number,
    upgradeAmountRequired?: number,
    upgradesToId?: number,
  ) {
    try {
      const element = await this.prisma.element.findUnique({
        where: {
          id: elementId,
        },
      });
      if (!element) {
        throw new BadRequestException('Element not found');
      }
      const abi = [
        'function createToken() external',
        'function getCurrentTokenID() public view returns (uint256)',
      ];
      const contract = new ethers.Contract(
        this.contractAddress,
        abi,
        this.adminWallet,
      );

      // Get the current token ID
      await contract.createToken();
      const currentTokenID = Number(await contract.getCurrentTokenID());

      const character = await this.prisma.character.create({
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
          upgradeReq: upgradeAmountRequired,
          upgradesToId: upgradesToId,
          tokenId: currentTokenID,
          tier: tier,
        },
      });

      return { success: true, character };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async editCharacter(
    id: number,
    name?: string,
    elementId?: number,
    power?: number,
    image?: string,
    upgradeAmountRequired?: number,
    upgradesToId?: number,
    tier?: number,
  ) {
    try {
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
      const character = await this.prisma.character.update({
        where: {
          id: id,
        },
        data: {
          ...(name && { name }),
          ...(elementId && { element: { connect: { id: elementId } } }),
          ...(power && { power }),
          ...(image && { image }),
          ...(upgradeAmountRequired && { upgradeReq: upgradeAmountRequired }),
          ...(upgradesToId && { upgradesToId }),
          ...(tier && { tier }),
        },
      });

      return { success: true, character };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async deleteCharacter(id: number) {
    try {
      await this.prisma.character.delete({
        where: {
          id: id,
        },
      });
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async getAllCharacters() {
    try {
      const characters = await this.prisma.character.findMany();
      return { success: true, characters };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async summonCharacter(walletAddress: string) {
    try {
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
        include: {
          element: true,
        },
      });

      const rarityChances = {
        R: 0.7,
        SR: 0.2,
        SSR: 0.09,
        UR: 0.01,
      };

      const rollRarity = () => {
        const random = Math.random();
        let accumulatedChance = 0;

        for (const rarity in rarityChances) {
          accumulatedChance += rarityChances[rarity];
          if (random < accumulatedChance) {
            return rarity;
          }
        }
      };

      const rolledRarity = rollRarity();

      var charactersByRarity = characters.filter(
        (character) => character.rarity === rolledRarity,
      );

      if (charactersByRarity.length === 0) {
        charactersByRarity = characters;
        // TODO: Uncomment this line
        // throw new BadRequestException(
        //   'No characters found for the rolled rarity',
        // );
      }

      const randomCharacter =
        charactersByRarity[
          Math.floor(Math.random() * charactersByRarity.length)
        ];

      if (!randomCharacter) {
        throw new BadRequestException('No characters available yet');
      }

      await this.prisma.unmintedCharacter.deleteMany({
        where: {
          userId: user.id,
        },
      });

      await this.prisma.unmintedCharacter.create({
        data: {
          character: {
            connect: {
              id: randomCharacter.id,
            },
          },
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      });

      // Check if user already has this character
      const existingUserCharacter = await this.prisma.userCharacter.findFirst({
        where: {
          userId: user.id,
          characterId: randomCharacter.id,
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

      return {
        success: true,
        character: randomCharacter,
        isNew: !existingUserCharacter,
      };
    } catch (error) {
      throw error;
    }
  }

  public async getUserCharacters(walletAddress: string) {
    try {
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

      return { success: true, userCharacters };
    } catch (error) {
      throw error;
    }
  }

  public async multiSummonCharacters(walletAddress: string) {
    try {
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

      await this.prisma.unmintedCharacter.deleteMany({
        where: {
          userId: user.id,
        },
      });

      const characters = await this.prisma.character.findMany({
        include: {
          element: true,
        },
      });

      if (characters.length === 0) {
        throw new BadRequestException('No characters found for this portal');
      }

      const summonResults = [];
      // Reward 10 random characters
      for (let i = 0; i < 10; i++) {
        const rarityChances = {
          R: 0.6,
          SR: 0.3,
          UR: 0.1,
        };

        const rollRarity = () => {
          const random = Math.random();
          let accumulatedChance = 0;

          for (const rarity in rarityChances) {
            accumulatedChance += rarityChances[rarity];
            if (random < accumulatedChance) {
              return rarity;
            }
          }
        };

        const rolledRarity = rollRarity();

        const charactersByRarity = characters.filter(
          (character) => character.rarity === rolledRarity,
        );

        if (charactersByRarity.length === 0) {
          throw new BadRequestException(
            'No characters found for the rolled rarity',
          );
        }

        const randomCharacter =
          charactersByRarity[
            Math.floor(Math.random() * charactersByRarity.length)
          ];

        // Create a mintable character
        await this.prisma.unmintedCharacter.create({
          data: {
            character: {
              connect: {
                id: randomCharacter.id,
              },
            },
            user: {
              connect: {
                id: user.id,
              },
            },
          },
        });

        const existingUserCharacter = await this.prisma.userCharacter.findFirst(
          {
            where: {
              userId: user.id,
              characterId: randomCharacter.id,
            },
          },
        );

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
    } catch (error) {
      throw error;
    }
  }

  public async mintCharacter(
    walletAddress: string,
    characterIds: number[],
    signature: string,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          walletAddress,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const unmintedCharacters = await this.prisma.unmintedCharacter.findMany({
        where: {
          userId: user.id,
          characterId: {
            in: characterIds,
          },
        },
      });

      if (!unmintedCharacters || unmintedCharacters.length === 0) {
        throw new BadRequestException(
          'Character not found in mintable list for this user.',
        );
      }

      const characters = await this.prisma.character.findMany({
        where: {
          id: {
            in: characterIds,
          },
        },
      });

      if (characters.length !== characterIds.length) {
        throw new BadRequestException('Character not found');
      }

      const signerAddress = ethers.verifyMessage(
        characterIds.join(',').toString(),
        signature,
      );

      if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new BadRequestException('Invalid signature');
      }

      const serverSignature = await this.generateServerSignature(
        characterIds,
        1,
      );

      const mintTransaction = await this.prisma.characterTransaction.create({
        data: {
          type: CharacterTransactionType.MINT,
          user: {
            connect: {
              id: user.id,
            },
          },
          characterIds: characterIds,
          status: TransactionStatus.INITIATED,
          userWallet: walletAddress,
          serverSignature,
        },
      });

      return {
        success: true,
        characterIds,
        serverSignature,
        transactionId: mintTransaction.id,
      };
    } catch (error) {
      throw error;
    }
  }

  public async verifyMintTransaction(
    mintTransactionId: number,
    walletAddress: string,
    serverSignature: string,
    txHash: string,
  ) {
    try {
      const tx = await this.prisma.characterTransaction.findFirst({
        where: {
          id: mintTransactionId,
          type: CharacterTransactionType.MINT,
          userWallet: walletAddress,
          serverSignature,
          status: TransactionStatus.INITIATED,
        },
      });

      if (!tx) {
        throw new BadRequestException('Transaction not found');
      }

      await this.prisma.characterTransaction.update({
        where: {
          id: mintTransactionId,
        },
        data: {
          status: TransactionStatus.PENDING,
          txHash,
        },
      });

      return {
        success: true,
        transactionId: mintTransactionId,
      };
    } catch (error) {
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  private async handleTransactions() {
    console.log('Checking character transactions...');
    const tx = await this.prisma.characterTransaction.findFirst({
      where: {
        status: TransactionStatus.PENDING,
      },
      orderBy: {
        retries: 'asc',
      },
    });
    try {
      if (!tx) {
        return;
      }

      const receipt = await this.provider.getTransactionReceipt(tx.txHash);

      if (!receipt) {
        throw new BadRequestException('Transaction not found');
      }

      if (receipt.status !== 1) {
        throw new BadRequestException('Transaction failed');
      }

      if (tx.type === CharacterTransactionType.MINT) {
        const characters = await this.prisma.character.findMany({
          where: {
            id: { in: tx.characterIds },
          },
        });

        for (const character of characters) {
          const existingUserCharacter =
            await this.prisma.userCharacter.findFirst({
              where: {
                userId: tx.userId,
                characterId: character.id,
              },
            });

          if (existingUserCharacter) {
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
            await this.prisma.userCharacter.create({
              data: {
                user: {
                  connect: {
                    id: tx.userId,
                  },
                },
                character: {
                  connect: {
                    id: character.id,
                  },
                },
                quantity: 1,
              },
            });
          }

          await this.prisma.unmintedCharacter.delete({
            where: {
              userId_characterId: {
                userId: tx.userId,
                characterId: character.id,
              },
            },
          });
        }
        console.log(
          `Mint transaction ${tx.txHash} successful. Awarded characters [${tx.characterIds}] to user ${tx.userWallet}`,
        );
      } else if (tx.type === CharacterTransactionType.BURN) {
        const userCharacter = await this.prisma.userCharacter.findFirst({
          where: {
            userId: tx.userId,
            characterId: tx.characterIds[0],
          },
          include: {
            character: true,
          },
        });

        if (!userCharacter) {
          throw new BadRequestException('User does not have this character');
        }

        await this.prisma.userCharacter.update({
          where: {
            id: userCharacter.id,
          },
          data: {
            quantity: {
              decrement: userCharacter.character.upgradeReq,
            },
          },
        });

        const newUserCharacter = await this.prisma.userCharacter.upsert({
          where: {
            userId_characterId: {
              userId: tx.userId,
              characterId: userCharacter.character.upgradesToId,
            },
          },
          update: {
            user: {
              connect: {
                id: tx.userId,
              },
            },
            character: {
              connect: {
                id: userCharacter.character.upgradesToId,
              },
            },
            quantity: {
              increment: 1,
            },
          },
          create: {
            user: {
              connect: {
                id: tx.userId,
              },
            },
            character: {
              connect: {
                id: userCharacter.character.upgradesToId,
              },
            },
            quantity: 1,
          },
          include: {
            character: true,
          },
        });

        console.log(
          `Burn transaction ${tx.txHash} successful. Burned ${userCharacter.character.upgradeReq} ${userCharacter.character.name} from user ${tx.userWallet} for ${newUserCharacter.character.name}`,
        );
      }

      await this.prisma.characterTransaction.update({
        where: {
          id: tx.id,
        },
        data: {
          status: TransactionStatus.COMPLETED,
        },
      });
    } catch (error) {
      await this.prisma.characterTransaction.update({
        where: {
          id: tx.id,
        },
        data: {
          retries: {
            increment: 1,
          },
        },
      });
      if (tx.retries >= 3) {
        await this.prisma.characterTransaction.update({
          where: {
            id: tx.id,
          },
          data: {
            status: TransactionStatus.FAILED,
          },
        });
      }
    }
  }

  public async summonGear(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          walletAddress,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.stars < 50) {
        throw new BadRequestException(
          'Insufficient stars balance. Required: 50 stars',
        );
      }

      // Reward random gear based on rarity
      const gearItems = await this.prisma.gearItem.findMany();

      if (gearItems.length === 0) {
        throw new BadRequestException('No gear items found');
      }

      const getRandomRarity = () => {
        const rarityChances = {
          common: 0.7, // 70% chance
          uncommon: 0.2, // 20% chance
          rare: 0.1, // 10% chance
        };
        const random = Math.random();
        let accumulatedChance = 0;

        for (const rarity in rarityChances) {
          accumulatedChance += rarityChances[rarity];
          if (random < accumulatedChance) {
            return rarity;
          }
        }
      };

      const rolledRarity = getRandomRarity();

      // Select a random item from gearItems that has the rolled rarity
      const filteredGear = gearItems.filter(
        (item) => item.rarity.toLowerCase() === rolledRarity.toLowerCase(),
      );

      if (filteredGear.length === 0) {
        throw new BadRequestException('No gear items found for this rarity');
      }

      const rewardedGear =
        filteredGear[Math.floor(Math.random() * filteredGear.length)];
      // Check if user already has this gear
      const existingUserGear = await this.prisma.userGearItem.findFirst({
        where: {
          userId: user.id,
          gearItemId: rewardedGear.id,
        },
      });

      if (existingUserGear) {
        // Increment quantity if user already has this gear
        await this.prisma.userGearItem.update({
          where: {
            id: existingUserGear.id,
          },
          data: {
            quantity: {
              increment: 1,
            },
          },
        });
      } else {
        // Create new user gear record if user doesn't have this gear yet
        await this.prisma.userGearItem.create({
          data: {
            user: {
              connect: {
                id: user.id,
              },
            },
            gearItem: {
              connect: {
                id: rewardedGear.id,
              },
            },
            quantity: 1,
          },
        });
      }

      // Deduct stars from user
      await this.prisma.user.update({
        where: {
          walletAddress,
        },
        data: {
          stars: {
            decrement: 50,
          },
        },
      });

      return {
        success: true,
        gear: rewardedGear,
      };
    } catch (error) {
      throw error;
    }
  }

  public async multiSummonGear(walletAddress: string, amount: number = 10) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          walletAddress,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Calculate total stars needed (50 stars per summon)
      const totalStarsNeeded = 50 * amount;

      if (user.stars < totalStarsNeeded) {
        throw new BadRequestException(
          `Insufficient stars balance. Required: ${totalStarsNeeded} stars`,
        );
      }

      // Reward random gear based on rarity
      const gearItems = await this.prisma.gearItem.findMany();

      if (gearItems.length === 0) {
        throw new BadRequestException('No gear items found');
      }

      const getRandomRarity = () => {
        const rarityChances = {
          common: 0.7, // 70% chance
          uncommon: 0.2, // 20% chance
          rare: 0.1, // 10% chance
        };
        const random = Math.random();
        let accumulatedChance = 0;

        for (const rarity in rarityChances) {
          accumulatedChance += rarityChances[rarity];
          if (random < accumulatedChance) {
            return rarity;
          }
        }
      };

      const rewardedGears = [];

      // Reward multiple gear items
      for (let i = 0; i < amount; i++) {
        const rolledRarity = getRandomRarity();

        // Select a random item from gearItems that has the rolled rarity
        const filteredGear = gearItems.filter(
          (item) => item.rarity.toLowerCase() === rolledRarity.toLowerCase(),
        );
        const rewardedGear =
          filteredGear[Math.floor(Math.random() * filteredGear.length)];

        // Check if user already has this gear
        const existingUserGear = await this.prisma.userGearItem.findFirst({
          where: {
            userId: user.id,
            gearItemId: rewardedGear.id,
          },
        });

        if (existingUserGear) {
          // Increment quantity if user already has this gear
          await this.prisma.userGearItem.update({
            where: {
              id: existingUserGear.id,
            },
            data: {
              quantity: {
                increment: 1,
              },
            },
          });
        } else {
          // Create new user gear record if user doesn't have this gear yet
          await this.prisma.userGearItem.create({
            data: {
              user: {
                connect: {
                  id: user.id,
                },
              },
              gearItem: {
                connect: {
                  id: rewardedGear.id,
                },
              },
              quantity: 1,
            },
          });
        }

        rewardedGears.push(rewardedGear);
      }

      // Deduct total stars from user
      await this.prisma.user.update({
        where: {
          walletAddress,
        },
        data: {
          stars: {
            decrement: totalStarsNeeded,
          },
        },
      });

      return {
        success: true,
        gears: rewardedGears,
      };
    } catch (error) {
      throw error;
    }
  }

  public async burnGear(walletAddress: string, gearItemId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          walletAddress,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const userGear = await this.prisma.userGearItem.findFirst({
        where: {
          userId: user.id,
          gearItemId: gearItemId,
        },
      });

      if (!userGear) {
        throw new BadRequestException('User does not have this gear');
      }

      if (userGear.quantity < 8) {
        throw new BadRequestException(
          'User does not have enough gear to burn. Required: 8',
        );
      }

      // Deduct 8 gear items from user
      await this.prisma.userGearItem.update({
        where: {
          id: userGear.id,
        },
        data: {
          quantity: {
            decrement: 8,
          },
        },
      });

      // Reward the user with the associated character of the burned gear
      const gearItem = await this.prisma.gearItem.findUnique({
        where: {
          id: gearItemId,
        },
      });

      const character = await this.prisma.character.findUnique({
        where: {
          id: gearItem.summonedCharacterId,
        },
      });

      const existingUserCharacter = await this.prisma.userCharacter.findFirst({
        where: {
          userId: user.id,
          characterId: character.id,
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
                id: character.id,
              },
            },
            quantity: 1,
          },
        });
      }

      return {
        success: true,
        character,
      };
    } catch (error) {
      throw error;
    }
  }

  private async generateServerSignature(
    ids: number[],
    amount: number,
  ): Promise<string> {
    const hash = ethers.solidityPackedKeccak256(
      ['address', 'uint256[]', 'uint256'],
      [this.adminWallet.address, ids, amount],
    );
    const signature = await this.adminWallet.signMessage(ethers.getBytes(hash));
    return signature;
  }

  public async verifyUpgradeTransaction(
    upgradeTransactionId: number,
    txHash: string,
  ) {
    try {
      const tx = await this.prisma.characterTransaction.update({
        where: {
          id: upgradeTransactionId,
        },
        data: {
          status: TransactionStatus.PENDING,
          txHash,
        },
      });

      if (!tx) {
        throw new BadRequestException('Transaction not found');
      }

      return {
        success: true,
        transactionId: upgradeTransactionId,
      };
    } catch (error) {
      throw error;
    }
  }

  public async upgradeCharacter(walletAddress: string, characterId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          walletAddress,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const character = await this.prisma.userCharacter.findUnique({
        where: {
          id: characterId,
        },
        include: {
          character: true,
        },
      });

      if (!character) {
        throw new BadRequestException('Character not found');
      }

      if (
        !character.character.upgradeReq ||
        !character.character.upgradesToId
      ) {
        throw new BadRequestException('Character cannot be upgraded');
      }

      if (character.readyToUpgrade) {
        throw new BadRequestException('Character is already ready to upgrade');
      }

      if (character.quantity < character.character.upgradeReq) {
        throw new BadRequestException(
          `Insufficient quantity. Required: ${character.character.upgradeReq} characters`,
        );
      }

      await this.prisma.userCharacter.update({
        where: {
          id: characterId,
        },
        data: {
          readyToUpgrade: true,
        },
      });

      const serverSignature = await this.generateServerSignature(
        [character.character.id],
        character.character.upgradeReq,
      );

      const upgradeTx = await this.prisma.characterTransaction.create({
        data: {
          type: CharacterTransactionType.BURN,
          user: {
            connect: {
              id: user.id,
            },
          },
          characterIds: [character.character.id],
          status: TransactionStatus.INITIATED,
          userWallet: walletAddress,
          serverSignature,
        },
      });

      return {
        success: true,
        serverSignature: serverSignature,
        transactionId: upgradeTx.id,
      };
    } catch (error) {
      throw error;
    }
  }

  public async getTiers(characterId: number) {
    var allCharacters = [];
    try {
      const character = await this.prisma.character.findUnique({
        where: {
          id: characterId,
        },
      });

      if (!character) {
        throw new BadRequestException('Character not found');
      }

      allCharacters.push(character);

      if (character.tier >= 2) {
        const prevCharacter = await this.prisma.character.findMany({
          where: {
            upgradesToId: character.id,
          },
        });
        allCharacters.push(prevCharacter[0]);

        if (prevCharacter[0].tier === 2) {
          const prevCharacter2 = await this.prisma.character.findMany({
            where: {
              upgradesToId: prevCharacter[0].id,
            },
          });
          allCharacters.push(prevCharacter2[0]);
        }
      }

      if (character.tier <= 2) {
        const nextCharacter = await this.prisma.character.findUnique({
          where: {
            id: character.upgradesToId,
          },
        });
        allCharacters.push(nextCharacter);

        if (nextCharacter.tier === 2) {
          const nextCharacter2 = await this.prisma.character.findUnique({
            where: {
              id: character.upgradesToId,
            },
          });
          allCharacters.push(nextCharacter2);
        }
      }

      return {
        success: true,
        characters: allCharacters,
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }
}

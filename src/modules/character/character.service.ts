import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { QuestService } from '../quest/quest.service';
import {
  CharacterRarity,
  CharacterTransactionType,
  GearItemType,
  TransactionStatus,
} from '@prisma/client';
import { ethers, toQuantity } from 'ethers';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  multiCharacterSummonCost,
  singleCharacterSummonCost,
} from '../../configs/global.config';
import { CharacterContractABI } from './character.contract.abi';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class CharacterService {
  constructor(
    private prisma: PrismaService,
    private questService: QuestService,
  ) {}
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
      const element = await this.prisma.element.findFirst({
        where: {
          id: elementId,
        },
      });

      if (!element) {
        throw new BadRequestException('Element not found');
      }
      const s3 = new S3Client({ region: process.env.AWS_REGION });
      const bucketName = process.env.AWS_BUCKET_NAME;
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: 'characters/metadata.json',
      });
      const response = await s3.send(command);

      // Convert the response body to a string
      const metadata = JSON.parse(
        await streamToString(response.Body as Readable),
      );

      // Interact with the contract to create a token
      const contract = new ethers.Contract(
        this.contractAddress,
        CharacterContractABI,
        this.adminWallet,
      );

      await contract.createToken();
      const tokenId = Number(await contract.getCurrentTokenID());

      // Add new character to metadata
      metadata.push({
        name,
        element: element.name.toUpperCase(),
        rarity,
        power,
        image,
        tier,
        tokenId,
        upgradeReq: upgradeAmountRequired,
        upgradesToId,
      });

      // Update metadata.json on S3
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: 'characters/metadata.json',
        Body: JSON.stringify(metadata),
        ContentType: 'application/json',
      });
      await s3.send(putCommand);

      // Call updateCharacterList to sync database
      await this.updateCharacterList();

      return { success: true };
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
    tier?: number,
    tokenId?: number,
    upgradeAmountRequired?: number,
    upgradesToId?: number,
  ) {
    try {
      let element = null;
      if (elementId) {
        element = await this.prisma.element.findUnique({
          where: {
            id: elementId,
          },
        });
        if (!element) {
          throw new BadRequestException('Element not found');
        }
      }
      const s3 = new S3Client({ region: process.env.AWS_REGION });
      const bucketName = process.env.AWS_BUCKET_NAME;
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: 'characters/metadata.json',
      });
      const response = await s3.send(command);

      // Convert the response body to a string
      const metadata = JSON.parse(
        await streamToString(response.Body as Readable),
      );

      // Find and update the character in metadata
      const characterIndex = metadata.findIndex((item) => item.tokenId === id);

      if (characterIndex === -1) {
        throw new BadRequestException('Character not found in metadata');
      }

      metadata[characterIndex] = {
        ...metadata[characterIndex],
        ...(name && { name }),
        ...(element && { element: element.name.toUpperCase() }),
        ...(power && { power }),
        ...(image && { image }),
        ...(tier && { tier }),
        ...(tokenId && { tokenId }),
        ...(upgradeAmountRequired && { upgradeReq: upgradeAmountRequired }),
        ...(upgradesToId && { upgradesToId }),
      };

      // Update metadata.json on S3
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: 'characters/metadata.json',
        Body: JSON.stringify(metadata),
        ContentType: 'application/json',
      });
      await s3.send(putCommand);

      // Call updateCharacterList to sync database
      await this.updateCharacterList();

      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async deleteCharacter(id: number) {
    try {
      const character = await this.prisma.character.delete({
        where: {
          id: id,
        },
      });
      const s3 = new S3Client({ region: process.env.AWS_REGION });
      const bucketName = process.env.AWS_BUCKET_NAME;
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: 'characters/metadata.json',
      });
      const response = await s3.send(command);

      // Convert the response body to a string
      const metadata = JSON.parse(
        await streamToString(response.Body as Readable),
      );

      // Remove the character from metadata
      const updatedMetadata = metadata.filter(
        (item) => item.tokenId !== character.tokenId,
      );

      // Update metadata.json on S3
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: 'characters/metadata.json',
        Body: JSON.stringify(updatedMetadata),
        ContentType: 'application/json',
      });
      await s3.send(putCommand);

      // Call updateCharacterList to sync database
      await this.updateCharacterList();

      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async updateCharacterList() {
    try {
      // Delete all characters from the database
      await this.prisma.character.deleteMany();

      // Fetch the total number of characters from the contract
      const contract = new ethers.Contract(
        this.contractAddress,
        CharacterContractABI,
        this.adminWallet,
      );

      const currentTokenID = Number(await contract.getCurrentTokenID());

      // Fetch metadata from the S3 bucket

      const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
      const bucketName = process.env.AWS_BUCKET_NAME;

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: 'characters/metadata.json',
      });
      const metadataObject = await s3.send(command);

      const metadata = JSON.parse(
        await metadataObject.Body.transformToString(),
      );

      // Filter out tokens with tokenId greater than currentTokenID
      const validMetadata = metadata.filter(
        (item) => item.tokenId <= currentTokenID,
      );

      // Process the valid metadata
      for (const item of validMetadata) {
        const element = await this.prisma.element.findFirst({
          where: {
            name: {
              equals: item.element,
              mode: 'insensitive',
            },
          },
        });
        await this.prisma.character.create({
          data: {
            name: item.name,
            element: {
              connect: {
                id: element.id,
              },
            },
            rarity: item.rarity as CharacterRarity,
            power: item.power,
            image: item.image,
            tier: item.tier,
            tokenId: item.tokenId,
            upgradeReq: item.upgradeReq,
            upgradesToId: item.upgradesToId,
            isPortal2: item.isPortal2 || false,
          },
        });
      }

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

      if (user.stars < singleCharacterSummonCost) {
        throw new BadRequestException(
          `Insufficient stars balance. Required: ${singleCharacterSummonCost} stars`,
        );
      }

      const characters = await this.prisma.character.findMany({
        where: {
          isPortal2: false,
        },
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

      const rollRarity = (ignoredRarities = []) => {
        const filteredRarities = Object.fromEntries(
          Object.entries(rarityChances).filter(
            ([key]) => !ignoredRarities.includes(key),
          ),
        );

        const random = Math.random();
        let accumulatedChance = 0;

        for (const rarity in filteredRarities) {
          accumulatedChance += rarityChances[rarity];
          if (random < accumulatedChance) {
            return rarity;
          }
        }
      };

      let rolledRarity = rollRarity();

      let charactersByRarity = characters.filter(
        (character) => character.rarity === rolledRarity,
      );

      const ignoredRarities = [rolledRarity];
      while (charactersByRarity.length === 0) {
        console.log(
          `No characters found for rarity: ${rolledRarity}. Rolling again...`,
        );
        rolledRarity = rollRarity(ignoredRarities);
        console.log('rolledRarity ===>', rolledRarity);
        charactersByRarity = characters.filter(
          (character) => character.rarity === rolledRarity,
        );
        ignoredRarities.push(rolledRarity);
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
          tokenId: randomCharacter.tokenId,
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
          status: TransactionStatus.INITIATED,
        },
      });

      // Check if user already has this character
      const existingUserCharacter = (
        await this.getUserCharacters(walletAddress)
      ).userCharacters;

      await this.prisma.user.update({
        where: {
          walletAddress,
        },
        data: {
          stars: {
            decrement: singleCharacterSummonCost,
          },
        },
      });

      try {
        if (rolledRarity === 'UR') {
          await this.questService.progressURCharactersQuest(walletAddress);
        }
      } catch (error) {
        console.error('Error progressing UR characters quest:', error);
      }

      return {
        success: true,
        character: randomCharacter,
        isNew: !existingUserCharacter,
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  public async getUserCharacters(walletAddress: string): Promise<{
    success: boolean;
    userCharacters?: Array<{
      id: number;
      name: string;
      rarity: CharacterRarity;
      power: number;
      image: string | null;
      video: string | null;
      tokenId: number;
      upgradeReq: number | null;
      upgradesToId: number | null;
      tier: number;
      isPortal2: boolean;
      element: {
        id: number;
        name: string;
        image: string;
        background: string | null;
      };
      quantity: number;
      inRaid: boolean;
      onTeam: boolean;
    }>;
    error?: any;
  }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          walletAddress,
        },
      });

      const ownedCharacters = [];

      const contract = new ethers.Contract(
        this.contractAddress,
        CharacterContractABI,
        this.adminWallet,
      );

      const currentTokenId = Number(await contract.getCurrentTokenID());

      const allTokenIds = Array.from(
        { length: currentTokenId },
        (_, i) => i + 1,
      );
      const accounts = Array(allTokenIds.length).fill(walletAddress);

      const tokenBalances = await contract.balanceOfBatch(
        accounts,
        allTokenIds,
      );

      for (const tokenId of allTokenIds) {
        const tokenBalance = Number(tokenBalances[tokenId - 1]);

        if (tokenBalance > 0) {
          const character = await this.prisma.character.findFirst({
            where: {
              tokenId,
            },
            include: {
              element: true,
            },
          });
          ownedCharacters.push({
            ...character,
            quantity: Number(tokenBalance),
          });
        }
      }

      const userCharactersMap = new Map<
        number,
        { character: any; quantity: number }
      >();

      for (const char of ownedCharacters) {
        const character = await this.prisma.character.findUnique({
          where: {
            id: char.id,
          },
          include: {
            element: true,
          },
        });

        const inRaid = user.raidCharacterIds.includes(char.id);
        const onTeam = user.teamCharacterIds.includes(char.id);

        userCharactersMap.set(character.tokenId, {
          character: {
            ...character,
            inRaid,
            onTeam,
          },
          quantity: char.quantity,
        });
      }

      const userCharacters = Array.from(userCharactersMap.values()).map(
        ({ character, quantity }) => ({
          ...character,
          quantity,
        }),
      );

      return { success: true, userCharacters };
    } catch (error) {
      console.error('Error fetching user characters:', error);
      return {
        success: false,
        error,
        userCharacters: [],
      };
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

      if (user.stars < multiCharacterSummonCost) {
        throw new BadRequestException(
          `Insufficient stars balance. Required: ${multiCharacterSummonCost} stars`,
        );
      }

      await this.prisma.unmintedCharacter.deleteMany({
        where: {
          userId: user.id,
        },
      });

      const characters = await this.prisma.character.findMany({
        where: {
          isPortal2: false,
        },
        include: {
          element: true,
        },
      });

      const summonResults = [];
      // Reward 10 random characters
      for (let i = 0; i < 10; i++) {
        const rarityChances = {
          R: 0.7,
          SR: 0.2,
          SSR: 0.09,
          UR: 0.01,
        };

        const rollRarity = (ignoredRarities = []) => {
          const filteredRarities = Object.fromEntries(
            Object.entries(rarityChances).filter(
              ([key]) => !ignoredRarities.includes(key),
            ),
          );

          const random = Math.random();
          let accumulatedChance = 0;
          for (const rarity in filteredRarities) {
            accumulatedChance += rarityChances[rarity];
            if (random < accumulatedChance) {
              return rarity;
            }
          }
        };

        let rolledRarity = rollRarity();

        let charactersByRarity = characters.filter(
          (character) => character.rarity === rolledRarity,
        );

        const ignoredRarities = [rolledRarity];
        while (charactersByRarity.length === 0) {
          console.log(
            `No characters found for rarity: ${rolledRarity}. Rolling again...`,
          );
          rolledRarity = rollRarity(ignoredRarities);
          console.log('rolledRarity ===>', rolledRarity);
          charactersByRarity = characters.filter(
            (character) => character.rarity === rolledRarity,
          );
          ignoredRarities.push(rolledRarity);
        }

        const randomCharacter =
          charactersByRarity[
            Math.floor(Math.random() * charactersByRarity.length)
          ];

        // console.log('randomCharacter ===>', randomCharacter);

        await this.prisma.unmintedCharacter.create({
          data: {
            tokenId: randomCharacter.tokenId,
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
            status: TransactionStatus.INITIATED,
          },
        });

        const existingUserCharacter = (
          await this.getUserCharacters(walletAddress)
        ).userCharacters;

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
            decrement: multiCharacterSummonCost,
          },
        },
      });

      return {
        success: true,
        summonResults,
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
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

      const unmintedCharacters = [];
      for (const characterId of characterIds) {
        const uChar = await this.prisma.unmintedCharacter.findFirst({
          where: {
            id: { notIn: unmintedCharacters.map((u) => u.id) }, // Avoid duplicates
            userId: user.id,
            tokenId: characterId,
            status: {
              in: [TransactionStatus.INITIATED, TransactionStatus.FAILED],
            },
          },
        });
        if (uChar) {
          unmintedCharacters.push(uChar);
          console.log(
            `Unminted character found: ${uChar.tokenId} uCharId: ${uChar.id}`,
          );
        } else {
          throw new BadRequestException(
            `Character with ID ${characterId} not found in mintable list.`,
          );
        }
      }

      const characters = [];

      for (const characterId of characterIds) {
        const character = await this.prisma.character.findFirst({
          where: {
            tokenId: characterId,
          },
        });
        if (character) {
          characters.push(character);
        } else {
          throw new BadRequestException(
            `Character with ID ${characterId} not found.`,
          );
        }
      }

      const signerAddress = ethers.verifyMessage(
        characterIds.join(',').toString(),
        signature,
      );
      console.log(
        `Signer: ${signerAddress} User (DB): ${walletAddress} Server: ${this.adminWallet.address}`,
      );
      if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new BadRequestException('Invalid signature');
      }

      const characterAmounts = characterIds.map(() => 1);

      const { serverSignature, nonce } = await this.generateServerSignature(
        characterIds,
        characterAmounts,
        user.walletAddress,
      );

      const unmintedCharacterIds = unmintedCharacters.map(
        (unminted) => unminted.id,
      );

      await this.prisma.unmintedCharacter.updateMany({
        where: {
          id: {
            in: unmintedCharacterIds,
          },
        },
        data: {
          status: TransactionStatus.PENDING,
        },
      });

      return {
        success: true,
        characterIds,
        serverSignature,
        nonce,
        unmintedCharacterIds,
      };
    } catch (error) {
      console.error('Error minting character:', error);
      return {
        success: false,
        error,
      };
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
      return {
        success: false,
        error,
      };
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
      return {
        success: false,
        error,
      };
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

      const burnAmount = 4;

      if (userGear.quantity < burnAmount) {
        throw new BadRequestException(
          `User does not have enough gear to burn. Required: ${burnAmount}`,
        );
      }

      // Use a transaction to ensure atomicity
      return await this.prisma.$transaction(async (prisma) => {
        // Reward the user with the associated character of the burned gear
        const gearItem = await prisma.gearItem.findUnique({
          where: {
            id: gearItemId,
          },
        });

        const character = await prisma.character.findFirst({
          where: {
            isPortal2: true,
            name: {
              contains: gearItem.type,
              mode: 'insensitive',
            },
            tier: 1,
          },
        });

        if (!character) {
          throw new BadRequestException('Character not found');
        }

        // Deduct 4 gear items from user
        await prisma.userGearItem.update({
          where: {
            id: userGear.id,
          },
          data: {
            quantity: {
              decrement: burnAmount,
            },
          },
        });

        const { serverSignature, nonce } = await this.generateServerSignature(
          [character.tokenId],
          [1],
          user.walletAddress,
        );

        return {
          success: true,
          serverSignature,
          character,
          nonce,
        };
      });
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  private async generateServerSignature(
    ids: number[],
    amounts: number[],
    walletAddress: string,
  ): Promise<{ serverSignature: string; nonce: number }> {
    const nonce = Date.now();
    const hash = ethers.solidityPackedKeccak256(
      ['address', 'uint256[]', 'uint256[]', 'uint256'],
      [walletAddress, ids, amounts, nonce],
    );
    const serverSignature = await this.adminWallet.signMessage(
      ethers.getBytes(hash),
    );
    return { serverSignature, nonce };
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

      const userCharacters = (await this.getUserCharacters(walletAddress))
        .userCharacters;

      if (!userCharacters.some((chr) => chr.id === characterId)) {
        throw new BadRequestException('Character not found in user list');
      }

      const character = await this.prisma.character.findUnique({
        where: {
          id: characterId,
        },
        include: {
          element: true,
        },
      });

      if (!character || !userCharacters) {
        throw new BadRequestException('Character not found');
      }

      if (!character.upgradeReq || !character.upgradesToId) {
        throw new BadRequestException('Character cannot be upgraded');
      }

      try {
        if (character.tier === 2) {
          await this.questService.progressT3CharactersQuest(walletAddress);
        }
      } catch (error) {
        console.error('Error progressing T3 characters quest:', error);
      }

      const ownedCharacter = userCharacters.find(
        (chr) => chr.id === characterId,
      );
      if (!ownedCharacter) {
        throw new BadRequestException('Character not found in user list');
      }

      const ownedCharacterQuantity = ownedCharacter.quantity;

      if (ownedCharacterQuantity < character.upgradeReq) {
        throw new BadRequestException(
          `Insufficient quantity. Required: ${character.upgradeReq} characters`,
        );
      }

      const { serverSignature, nonce } = await this.generateServerSignature(
        [character.tokenId],
        [character.upgradeReq],
        user.walletAddress,
      );

      return {
        success: true,
        serverSignature: serverSignature,
        nonce,
        oldTokenId: character.tokenId,
        oldTokenAmount: character.upgradeReq,
        newTokenId: character.upgradesToId,
        character,
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  private async getTiers(tokenId: number) {
    var allCharacters = [];
    try {
      const character = await this.prisma.character.findUnique({
        where: {
          tokenId,
        },
      });

      if (!character) {
        throw new BadRequestException(
          `Character (${character.tokenId}) not found`,
        );
      }

      allCharacters.push(character);

      if (character.upgradesToId === null) {
        return {
          success: true,
          characters: allCharacters,
        };
      }

      const characterT2 = await this.prisma.character.findUnique({
        where: {
          tokenId: character.upgradesToId,
        },
      });

      if (!characterT2) {
        throw new BadRequestException(
          `Character (${character.tokenId}) T2 (${character.upgradesToId}) not found`,
        );
      }

      allCharacters.push(characterT2);

      if (characterT2.upgradesToId === null) {
        return {
          success: true,
          characters: allCharacters,
        };
      }

      const characterT3 = await this.prisma.character.findUnique({
        where: {
          tokenId: characterT2.upgradesToId,
        },
      });

      if (!characterT3) {
        throw new BadRequestException(
          `Character (${character.tokenId}) T3 (${character.upgradesToId}) not found`,
        );
      }

      allCharacters.push(characterT3);

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

  public async getAllCharacterTiers(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          walletAddress,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const allT1Characters = await this.prisma.character.findMany({
        where: {
          tier: 1,
        },
        include: {
          element: true,
        },
      });

      const userCharactersResponse = await this.getUserCharacters(
        walletAddress,
      );

      if (!userCharactersResponse.success) {
        throw new BadRequestException(
          'Error fetching user characters for tier calculation',
        );
      }
      const userCharacters = userCharactersResponse.userCharacters;

      const response = {
        portal1: [],
        portal2: [],
      };

      for (const char of allT1Characters) {
        const allTiers = await this.getTiers(char.id);
        if (allTiers.success) {
          const charTiers = allTiers.characters;
          const t1Char = charTiers.find((c) => c.tier === 1);
          const t2Char = charTiers.find((c) => c.tier === 2);
          const t3Char = charTiers.find((c) => c.tier === 3);

          const t1OwnedCharacter = userCharacters.find(
            (c) => c.id === (t1Char ? t1Char.id : -1),
          );
          const t1Amount = t1OwnedCharacter ? t1OwnedCharacter.quantity : 0;

          const t2OwnedCharacter = userCharacters.find(
            (c) => c.id === (t2Char ? t2Char.id : -1),
          );
          const t2Amount = t2OwnedCharacter ? t2OwnedCharacter.quantity : 0;
          const t3OwnedCharacter = userCharacters.find(
            (c) => c.id === (t3Char ? t3Char.id : -1),
          );
          const t3Amount = t3OwnedCharacter ? t3OwnedCharacter.quantity : 0;

          const responseData = {
            stage1: {
              ...t1Char,
              quantity: t1Amount,
            },
            stage2: {
              ...t2Char,
              quantity: t2Amount,
            },
            stage3: {
              ...t3Char,
              quantity: t3Amount,
            },
          };

          if (char.isPortal2) {
            response.portal2.push(responseData);
          } else {
            response.portal1.push(responseData);
          }
        } else {
          throw new BadRequestException(
            `Error fetching character tiers for character: ${char.id}`,
          );
        }
      }

      return {
        success: true,
        allCharacterTiers: response,
      };
    } catch (error) {
      console.error('Error fetching all character tiers:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  public async handleFailedMintCharacter(
    userWalletAddress: string,
    unmintedCharacterId: string,
  ) {
    try {
      const unmintedCharacter = await this.prisma.unmintedCharacter.findUnique({
        where: {
          id: unmintedCharacterId,
        },
        include: {
          user: true,
        },
      });

      if (!unmintedCharacter) {
        throw new BadRequestException('Unminted character not found');
      }

      if (unmintedCharacter.user.walletAddress !== userWalletAddress) {
        throw new BadRequestException('User not found');
      }

      await this.prisma.unmintedCharacter.update({
        where: {
          id: unmintedCharacterId,
        },
        data: {
          status: TransactionStatus.FAILED,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error in handleFailedMintCharacter:', error);
      return {
        success: false,
        error,
      };
    }
  }
}

// Helper function to convert stream to string
async function streamToString(stream: Readable): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

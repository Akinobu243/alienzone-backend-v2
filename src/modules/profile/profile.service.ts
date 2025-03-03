import { DailyRewardType, ItemQuality, ItemType } from '@prisma/client';
import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateAlienDTO } from './dto/profile.dto';
import {
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  private s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  public async getProfile(walletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress: walletAddress.toLowerCase(),
      },
    });

    // get total referrals
    const totalReferrals = await this.prisma.user.count({
      where: {
        referrerId: user.id,
      },
    });

    var isStarBoostActive = false,
      isXpBoostActive = false,
      isRaidBoostActive = false;
    if (user.starsBoost > 0) {
      isStarBoostActive =
        new Date().getTime() - user.lastStarBoost.getTime() <
        24 * 60 * 60 * 1000;
    }
    if (user.xpBoost > 0) {
      isXpBoostActive =
        new Date().getTime() - user.lastXpBoost.getTime() < 24 * 60 * 60 * 1000;
    }
    if (user.raidTimeBoost > 0) {
      isRaidBoostActive =
        new Date().getTime() - user.lastRaidBoost.getTime() <
        24 * 60 * 60 * 1000;
    }
    return {
      walletAddress: user.walletAddress,
      name: user.name,
      country: user.country,
      twitterId: user.twitterId,
      image: user.image,
      level: user.level,
      experience: user.experience,
      reputation: user.reputation,
      stars: user.stars,
      refferalCode: user.referralCode,
      totalReferrals,
      starsBoost: isStarBoostActive ? user.starsBoost : 0,
      xpBoost: isXpBoostActive ? user.xpBoost : 0,
      raidTimeBoost: isRaidBoostActive ? user.raidTimeBoost : 0,
    };
  }

  public async createAlien(
    walletAddress: string,
    createAlienDTO: CreateAlienDTO,
    image: Express.Multer.File,
  ) {
    const element = await this.prisma.element.findUnique({
      where: {
        id: Number(createAlienDTO.elementId),
      },
    });
    if (!element) {
      throw new BadRequestException('Element not found');
    }

    const alien = await this.prisma.alien.create({
      data: {
        name: createAlienDTO.name,
        element: {
          connect: {
            id: Number(createAlienDTO.elementId),
          },
        },
        strengthPoints: Number(createAlienDTO.strengthPoints),
        inRaid: false,
        selected: true,
        user: {
          connect: { walletAddress },
        },
      },
    });

    // upload image to s3
    try {
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `aliens/${alien.id}_${createAlienDTO.name}.png`,
        Body: image.buffer,
        ContentType: 'image/png',
      };
      const uploadCommand = new PutObjectCommand(uploadParams);
      await this.s3.send(uploadCommand);
    } catch (error) {
      console.error(`Error uploading image to S3: ${error}`);
    }

    await this.prisma.alien.update({
      where: {
        id: alien.id,
      },
      data: {
        image: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/aliens/${alien.id}_${createAlienDTO.name}.png`,
      },
    });
  }

  public async getAliens(walletAddress: string) {
    const aliens = await this.prisma.alien.findMany({
      where: {
        user: {
          walletAddress: walletAddress,
        },
      },
      include: {
        element: true,
      },
    });

    return aliens;
  }

  public async getCharacters(walletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });
    const characters = await this.prisma.userCharacter.findMany({
      where: {
        userId: user.id,
      },
    });

    return characters;
  }

  public async getItems(walletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });
    const items = await this.prisma.userItem.findMany({
      where: {
        userId: user.id,
      },
    });

    return items;
  }

  public async getLeaderboard() {
    const users = await this.prisma.user.findMany({
      orderBy: {
        reputation: 'desc',
      },
      take: 10,
    });

    return users.map((user) => {
      return {
        name: user.name,
        country: user.country,
        enterprise: user.enterprise,
        image: user.image,
        level: user.level,
        experience: user.experience,
        reputation: user.reputation,
      };
    });
  }

  public async awardDailyRewards(walletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const dailyRewards = await this.prisma.dailyReward.findMany();
    dailyRewards.sort((a, b) => a.id - b.id);
    let reward;

    const hours24 = 24 * 60 * 60 * 1000;
    const hours48 = 48 * 60 * 60 * 1000;
    const currentTime = new Date().getTime();
    const lastClaimedTime = user.lastDailyClaimed.getTime();
    const timeSinceLastClaim = currentTime - lastClaimedTime;

    if (timeSinceLastClaim < hours24) {
      throw new BadRequestException('No daily rewards available yet.');
    } else if (timeSinceLastClaim >= hours24 && timeSinceLastClaim < hours48) {
      reward = dailyRewards[user.dailyStreak];
      await this.prisma.user.update({
        where: {
          walletAddress,
        },
        data: {
          dailyStreak: user.dailyStreak + 1,
          lastDailyClaimed: new Date(),
        },
      });
    } else {
      reward = dailyRewards[0];
      await this.prisma.user.update({
        where: {
          walletAddress,
        },
        data: {
          dailyStreak: 1,
          lastDailyClaimed: new Date(),
        },
      });
    }

    if (reward.type === DailyRewardType.ITEM) {
      await this.prisma.userItem.create({
        data: {
          user: {
            connect: {
              id: user.id,
            },
          },
          item: {
            connect: {
              id: reward.itemId,
            },
          },
          quantity: reward.amount,
        },
      });
    } else {
      await this.prisma.user.update({
        where: {
          walletAddress,
        },
        data: {
          stars: {
            increment: reward.amount,
          },
        },
      });
    }
  }

  public async updateStarBalance(walletAddress: string, amount: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const newBalance = user.stars + amount;
    await this.prisma.user.update({
      where: {
        walletAddress,
      },
      data: {
        stars: newBalance,
      },
    });
  }

  public async getAllTraits() {
    const traitFolders = ['Body', 'Elements', 'Eyes', 'Face', 'Hair', 'Mouth'];
    const allImages = {};

    try {
      for (const folder of traitFolders) {
        const input = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Prefix: `traits/${folder}/`,
          MaxKeys: 1000,
        };
        const command = new ListObjectsCommand(input);
        const response = await this.s3.send(command);

        const images = response.Contents.map(
          (content) =>
            `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${content.Key}`,
        );
        allImages[folder] = images;
      }
    } catch (error) {
      console.error(`Error listing objects in S3: ${error}`);
    }

    return allImages;
  }

  public async getOnboardingData() {
    const alienParts = await this.prisma.alienPart.findMany({
      where: {
        isDefault: true,
      },
    });
    const groups = alienParts.reduce((acc, part) => {
      acc[part.type] = acc[part.type] || [];
      acc[part.type].push(part);
      return acc;
    }, {});

    // elements
    const elements = await this.prisma.element.findMany({
      where: {
        isDefault: true,
      },
    });

    return { alienParts: groups, elements };
  }

  public async useReferralCode(walletAddress: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const referrer = await this.prisma.user.findUnique({
      where: { referralCode: code },
    });

    if (!referrer) {
      throw new BadRequestException('Referral code not found');
    }

    if (user.referrerId) {
      throw new BadRequestException('Referral code already used');
    }

    // Create referral reward record
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { walletAddress },
        data: { referrerId: referrer.id },
      }),
      this.prisma.user.update({
        where: { id: referrer.id },
        data: { stars: { increment: 40 } },
      }),
      this.prisma.referralReward.create({
        data: {
          referrerId: referrer.id,
          refereeId: user.id,
          starsEarned: 40,
        },
      }),
    ]);
  }

  public async getUnseenReferralRewards(walletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const rewards = await this.prisma.referralReward.aggregate({
      where: {
        referrerId: user.id,
        seen: false,
      },
      _sum: {
        starsEarned: true,
      },
    });

    return rewards._sum.starsEarned || 0;
  }

  public async markReferralRewardsAsSeen(walletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.prisma.referralReward.updateMany({
      where: {
        referrerId: user.id,
        seen: false,
      },
      data: {
        seen: true,
      },
    });
  }

  public async useConsumableItem(walletAddress: string, itemId: number) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const userItem = await this.prisma.userItem.findFirst({
      where: {
        userId: user.id,
        itemId,
      },
      include: {
        item: true,
      },
    });

    if (!userItem || userItem.quantity < 1) {
      throw new BadRequestException('Item not found');
    }

    let boostAmount = 0;
    let boostType = '';
    switch (userItem.item.type) {
      case ItemType.SHEARS:
        boostType = 'stars';
        break;
      case ItemType.CUT:
        boostType = 'raidTimeBoost';
        break;
      case ItemType.KNIFE:
        boostType = 'xpBoost';
        break;
      default:
        throw new BadRequestException('Invalid item type');
    }
    switch (userItem.item.quality) {
      case ItemQuality.BRONZE:
        boostAmount = 0.02;
        break;
      case ItemQuality.SILVER:
        boostAmount = 0.04;
        break;
      case ItemQuality.GOLDEN:
        boostAmount = 0.08;
        break;
    }

    await this.prisma.user.update({
      where: {
        walletAddress,
      },
      data: {
        ...(boostType === 'stars'
          ? { starsBoost: boostAmount, lastStarBoost: new Date() }
          : {}),
        ...(boostType === 'raidTimeBoost'
          ? { raidTimeBoost: boostAmount, lastRaidBoost: new Date() }
          : {}),
        ...(boostType === 'xpBoost'
          ? { xpBoost: boostAmount, lastXpBoost: new Date() }
          : {}),
      },
    });

    await this.prisma.userItem.update({
      where: {
        id: userItem.id,
      },
      data: {
        quantity: {
          decrement: 1,
        },
      },
    });
  }

  public async updateTeam(
    walletAddress: string,
    characterIds: number[],
    alienIds: number[],
  ) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) { 
      throw new BadRequestException('User not found');
    }
    console.log(alienIds.length, characterIds.length);
    if (alienIds.length < 1 || characterIds.length + alienIds.length > 5) {
      throw new BadRequestException(
        'Invalid team configuration. Team must contain at least 1 alien and no more than 5 characters and aliens combined.',
      );
    }

    const characters = await this.prisma.userCharacter.findMany({
      where: {
        userId: user.id,
      },
    });

    const aliens = await this.prisma.alien.findMany({
      where: {
        userId: user.id,
      },
    });
    console.log(characters);
    for (const characterId of characterIds) {
      if (
        !characters.some((character) => character.characterId === characterId)
      ) {
        throw new BadRequestException(
          `Character with ID ${characterId} not found in user's characters.`,
        );
      }
    }

    for (const alienId of alienIds) {
      if (!aliens.some((alien) => alien.id === alienId)) {
        throw new BadRequestException(
          `Alien with ID ${alienId} not found in user's aliens.`,
        );
      }
    }

    // Remove all characters and aliens from team
    const userCharacters = await this.prisma.userCharacter.updateMany({
      where: {
        userId: user.id,
      },
      data: {
        onTeam: false,
      },
    });

    await this.prisma.alien.updateMany({
      where: {
        userId: user.id,
      },
      data: {
        onTeam: false,
      },
    });

    // Add selected characters and aliens to team
    for (const characterId of characterIds) {
      await this.prisma.userCharacter.update({
        where: {
          userId_characterId: {
            userId: user.id,
            characterId: characterId,
          },
        },
        data: {
          onTeam: true,
        },
      });
    }

    for (const alienId of alienIds) {
      await this.prisma.alien.update({
        where: {
          id: alienId,
        },
        data: {
          onTeam: true,
        },
      });
    }
  }

  public async getTeam(walletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    var isStarBoostActive = false,
      isXpBoostActive = false,
      isRaidBoostActive = false;
    if (user.starsBoost > 0) {
      isStarBoostActive =
        new Date().getTime() - user.lastStarBoost.getTime() <
        24 * 60 * 60 * 1000;
    }
    if (user.xpBoost > 0) {
      isXpBoostActive =
        new Date().getTime() - user.lastXpBoost.getTime() < 24 * 60 * 60 * 1000;
    }
    if (user.raidTimeBoost > 0) {
      isRaidBoostActive =
        new Date().getTime() - user.lastRaidBoost.getTime() <
        24 * 60 * 60 * 1000;
    }

    const characters = await this.prisma.userCharacter.findMany({
      where: {
        userId: user.id,
        onTeam: true,
      },
      include: {
        character: {
          include: {
            element: true,
          },
        },
      },
    });

    const aliens = await this.prisma.alien.findMany({
      where: {
        userId: user.id,
        onTeam: true,
      },
      include: {
        element: true,
      },
    });

    let teamStrengthPoints = 0;
    let synergies = {};
    let teamResponse = [];
    for (const character of characters) {
      teamStrengthPoints += character.character.power;
      synergies[character.character.element.name] =
        synergies[character.character.element.name] || 0;
      synergies[character.character.element.name] += 1;
      teamResponse.push({
        id: character.id,
        name: character.character.name,
        strengthPoints: character.character.power,
        element: character.character.element,
        image: character.character.image,
        type: 'character',
      });
    }
    for (const alien of aliens) {
      teamStrengthPoints += alien.strengthPoints;
      synergies[alien.element.name] = synergies[alien.element.name] || 0;
      synergies[alien.element.name] += 1;
      teamResponse.push({
        id: alien.id,
        name: alien.name,
        strengthPoints: alien.strengthPoints,
        element: alien.element,
        image: alien.image,
        type: 'alien',
      });
    }

    return {
      teamStrengthPoints: teamStrengthPoints,
      team: teamResponse,
      synergies: synergies,
      buffs: {
        starsBoost: isStarBoostActive ? user.starsBoost : 0,
        xpBoost: isXpBoostActive ? user.xpBoost : 0,
        raidTimeBoost: isRaidBoostActive ? user.raidTimeBoost : 0,
      },
    };
  }
}

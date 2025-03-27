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
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          walletAddress: walletAddress.toLowerCase(),
        },
        include: {
          claimedDailyRewards: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

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
          new Date().getTime() - user.lastXpBoost.getTime() <
          24 * 60 * 60 * 1000;
      }
      if (user.raidTimeBoost > 0) {
        isRaidBoostActive =
          new Date().getTime() - user.lastRaidBoost.getTime() <
          24 * 60 * 60 * 1000;
      }
      return {
        success: true,
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
        claimedDailyRewards: user.claimedDailyRewards,
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  public async createAlien(
    walletAddress: string,
    createAlienDTO: CreateAlienDTO,
    image: Express.Multer.File,
  ) {
    try {
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
          onTeam: true,
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

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
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

  public async getLeaderboard(
    walletAddress: string,
    offset: number,
    limit: number,
    filter: string,
    search: string,
  ) {
    let users;

    if (filter === 'enterprises') {
      users = await this.prisma.user.findMany({
        where: {
          enterprise: {
            contains: search,
            mode: 'insensitive',
          },
        },
        orderBy: {
          reputation: 'desc',
        },
        skip: offset,
        take: limit,
      });
    } else if (filter === 'likes') {
      const likedUserIds = (
        await this.prisma.user.findUnique({
          where: { walletAddress },
          select: {
            likedUserIds: true,
          },
        })
      ).likedUserIds;

      users = await this.prisma.user.findMany({
        where: {
          id: { in: likedUserIds },
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        orderBy: {
          reputation: 'desc',
        },
        skip: offset,
        take: limit,
      });
    } else {
      users = await this.prisma.user.findMany({
        where: {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        orderBy: {
          reputation: 'desc',
        },
        skip: offset,
        take: limit,
      });
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    let currentUserRank = null;

    if (filter === 'enterprises') {
      currentUserRank = await this.prisma.user.count({
        where: {
          enterprise: {
            contains: search,
            mode: 'insensitive',
          },
          reputation: {
            gt: currentUser.reputation,
          },
        },
      });
    } else if (filter === 'likes') {
      const likedUserIds = (
        await this.prisma.user.findUnique({
          where: { walletAddress },
          select: {
            likedUserIds: true,
          },
        })
      ).likedUserIds;

      currentUserRank = await this.prisma.user.count({
        where: {
          id: { in: likedUserIds },
          name: {
            contains: search,
            mode: 'insensitive',
          },
          reputation: {
            gt: currentUser.reputation,
          },
        },
      });
    } else {
      currentUserRank = await this.prisma.user.count({
        where: {
          name: {
            contains: search,
            mode: 'insensitive',
          },
          reputation: {
            gt: currentUser.reputation,
          },
        },
      });
    }

    const likedUserIds = (
      await this.prisma.user.findUnique({
        where: { walletAddress: currentUser.walletAddress },
        select: {
          likedUserIds: true,
        },
      })
    ).likedUserIds;

    currentUserRank += 1;
    return {
      users: users.map((user, index) => {
        return {
          id: user.id,
          name: user.name,
          country: user.country,
          enterprise: user.enterprise,
          image: user.image,
          level: user.level,
          experience: user.experience,
          reputation: user.reputation,
          walletAddress: user.walletAddress,
          rank: index + 1,
          stars: user.stars,
          createdAt: user.createdAt,
          twitterId: user.twitterId,
          isLiked: likedUserIds.includes(user.id),
          // isLiked: true,
        };
      }),
      // only return if user is not in users array
      thisUser: users.some(
        (user) => user.walletAddress === currentUser.walletAddress,
      )
        ? undefined
        : {
            name: currentUser.name,
            country: currentUser.country,
            enterprise: currentUser.enterprise,
            image: currentUser.image,
            level: currentUser.level,
            experience: currentUser.experience,
            reputation: currentUser.reputation,
            rank: currentUserRank,
            stars: currentUser.stars,
            createdAt: currentUser.createdAt,
          },
    };
  }

  public async likeUser(walletAddress: string, userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          walletAddress,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const likedUser = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!likedUser) {
        throw new BadRequestException('Liked user not found');
      }

      const alreadyLiked = user.likedUserIds.includes(userId);

      if (alreadyLiked) {
        await this.prisma.user.update({
          where: {
            walletAddress,
          },
          data: {
            likedUserIds: {
              set: user.likedUserIds.filter((id) => id !== userId),
            },
          },
        });
      } else {
        await this.prisma.user.update({
          where: {
            walletAddress,
          },
          data: {
            likedUserIds: {
              push: userId,
            },
          },
        });
      }

      return {
        success: true,
        liked: alreadyLiked ? false : true,
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  public async getDailyRewards(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
        include: {
          claimedDailyRewards: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const dailyRewards = await this.prisma.dailyReward.findMany();

      return {
        success: true,
        dailyRewards,
        dailyStreak: user.dailyStreak,
        lastDailyClaimed: user.lastDailyClaimed,
        claimedDailyRewards: user.claimedDailyRewards,
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  private async rewardItem(walletAddress: string, itemId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    const userItem = await this.prisma.userItem.findFirst({
      where: {
        userId: user.id,
        itemId: itemId,
      },
    });

    await this.prisma.userItem.upsert({
      where: {
        id: userItem?.id,
      },
      update: {
        quantity: userItem?.quantity + 1,
      },
      create: {
        user: {
          connect: { id: user.id },
        },
        item: {
          connect: { id: itemId },
        },
        quantity: 1,
      },
    });
  }

  private async rewardAlienPart(walletAddress: string, alienPartId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
      include: {
        AlienPartGroups: true,
      },
    });

    const alienPart = await this.prisma.alienPart.findFirst({
      where: {
        id: alienPartId,
      },
    });

    const userAlienPartGroup = await this.prisma.alienPartGroup.findFirst({
      where: {
        userId: user.id,
      },
      include: {
        parts: true,
      },
    });

    await this.prisma.alienPartGroup.update({
      where: {
        id: userAlienPartGroup.id,
      },
      data: {
        parts: {
          set: [...userAlienPartGroup.parts, alienPart],
        },
      },
    });
  }

  private async rewardGearItem(walletAddress: string, gearItemId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    const userGearItem = await this.prisma.userGearItem.findFirst({
      where: {
        userId: user.id,
        gearItemId: gearItemId,
      },
    });

    await this.prisma.userGearItem.upsert({
      where: {
        id: userGearItem?.id,
      },
      update: {
        quantity: userGearItem?.quantity + 1,
      },
      create: {
        user: {
          connect: { id: user.id },
        },
        gearItem: {
          connect: { id: gearItemId },
        },
        quantity: 1,
      },
    });
  }

  private async rewardStars(walletAddress: string, amount: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        stars: {
          increment: amount,
        },
      },
    });
  }

  private async rewardXp(walletAddress: string, amount: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        experience: {
          increment: amount,
        },
      },
    });
  }

  public async claimDailyReward(walletAddress: string) {
    try {
      var user = await this.prisma.user.findUnique({
        where: {
          walletAddress,
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailyReward = await this.prisma.dailyReward.findFirst({
        where: {
          rewardDate: today,
        },
      });

      if (!dailyReward) {
        throw new Error('No daily reward available');
      }

      if (user.claimedDailyRewardIds.includes(dailyReward.id)) {
        throw new Error('Daily reward already claimed');
      }

      if (user.lastDailyClaimed) {
        const lastClaimed = new Date(user.lastDailyClaimed);
        lastClaimed.setHours(0, 0, 0, 0);

        if (lastClaimed.getTime() === today.getTime()) {
          throw new Error('Daily reward already claimed');
        }

        const timeDifference = today.getTime() - lastClaimed.getTime();
        if (
          timeDifference >= 24 * 60 * 60 * 1000 &&
          timeDifference <= 48 * 60 * 60 * 1000
        ) {
          user = await this.prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              dailyStreak: {
                increment: 1,
              },
            },
          });
        } else if (timeDifference > 48 * 60 * 60 * 1000) {
          user = await this.prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              dailyStreak: 0,
            },
          });
        }
      }

      user = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          dailyStreak: {
            increment: 1,
          },
        },
      });

      switch (dailyReward.type) {
        case DailyRewardType.STARS:
          await this.rewardStars(
            walletAddress,
            dailyReward.amount * user.dailyStreak,
          );
          break;
        case DailyRewardType.XP:
          await this.rewardXp(
            walletAddress,
            dailyReward.amount * user.dailyStreak,
          );
          break;
        case DailyRewardType.ITEM:
          await this.rewardItem(walletAddress, dailyReward.itemId);
          break;
        case DailyRewardType.PARTS:
          await this.rewardAlienPart(walletAddress, dailyReward.alienPartId);
          break;
        case DailyRewardType.GEAR:
          await this.rewardGearItem(walletAddress, dailyReward.gearItemId);
          break;
      }

      user = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          lastDailyClaimed: new Date(),
          claimedDailyRewardIds: {
            push: dailyReward.id,
          },
        },
      });

      return {
        success: true,
        message: 'Reward claimed',
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  public async updateStarBalanceV1(walletAddress: string, amount: number) {
    try {
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
    } catch (error) {
      console.error(`Error updating star balance: ${error}`);
    }
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
    try {
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
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  public async getUnseenReferralRewards(walletAddress: string) {
    try {
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
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  public async markReferralRewardsAsSeen(walletAddress: string) {
    try {
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
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  public async useConsumableItem(walletAddress: string, itemId: number) {
    try {
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
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  public async updateTeam(
    walletAddress: string,
    alienIds: number[],
    characterIds: number[],
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }
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
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  public async getTeam(walletAddress: string) {
    try {
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
          new Date().getTime() - user.lastXpBoost.getTime() <
          24 * 60 * 60 * 1000;
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
          isSelected: alien.selected,
        });
      }

      return {
        success: true,
        teamStrengthPoints: teamStrengthPoints,
        team: teamResponse.reverse(),
        synergies: synergies,
        buffs: {
          starsBoost: isStarBoostActive ? user.starsBoost : 0,
          xpBoost: isXpBoostActive ? user.xpBoost : 0,
          raidTimeBoost: isRaidBoostActive ? user.raidTimeBoost : 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  public async getEquippedAlienParts(walletAddress: string, alienId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const alien = await this.prisma.alien.findFirst({
        where: {
          id: alienId,
          userId: user.id,
        },
        include: {
          body: true,
          clothes: true,
          head: true,
          eyes: true,
          mouth: true,
          hair: true,
          marks: true,
          powers: true,
          accessories: true,
          face: true,
        },
      });

      if (!alien) {
        throw new BadRequestException('Alien not found');
      }

      const parts = {
        body: alien.body,
        clothes: alien.clothes,
        head: alien.head,
        eyes: alien.eyes,
        mouth: alien.mouth,
        hair: alien.hair,
        marks: alien.marks,
        powers: alien.powers,
        accessories: alien.accessories,
        face: alien.face,
      };

      return parts;
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  public async getOwnedAlienParts(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const userAlienParts = await this.prisma.alienPartGroup.findMany({
        where: {
          userId: user.id,
        },
        include: {
          parts: true,
        },
      });

      return userAlienParts;
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  public async equipAlienPart(
    walletAddress: string,
    alienId: number,
    partId: number,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const alien = await this.prisma.alien.findFirst({
        where: {
          id: alienId,
          userId: user.id,
        },
      });

      if (!alien) {
        throw new BadRequestException('Alien not found');
      }

      const part = await this.prisma.alienPart.findUnique({
        where: { id: partId },
      });

      if (!part) {
        throw new BadRequestException('Alien part not found');
      }

      const userAlienPartGroup = await this.prisma.alienPartGroup.findFirst({
        where: {
          userId: user.id,
        },
        include: {
          parts: true,
        },
      });

      const userAlienParts = userAlienPartGroup.parts;

      if (!userAlienParts.some((userPart) => userPart.id === partId)) {
        throw new BadRequestException('Alien part not found in user inventory');
      }

      // Determine the field to update based on the part type
      const partFieldMap = {
        BODY: 'bodyId',
        CLOTHES: 'clothesId',
        HEAD: 'headId',
        EYES: 'eyesId',
        MOUTH: 'mouthId',
        HAIR: 'hairId',
        MARKS: 'marksId',
        POWERS: 'powersId',
        ACCESSORIES: 'accessoriesId',
        FACE: 'faceId',
      };

      const partField = partFieldMap[part.type];
      if (!partField) {
        throw new BadRequestException('Invalid part type');
      }

      // Update the alien with the new part
      await this.prisma.alien.update({
        where: { id: alien.id },
        data: {
          [partField]: part.id,
        },
      });

      // TODO: Update alien image with new equipped parts by updating the metadata and then generating a new image

      return {
        success: true,
        message: `Part of type ${part.type} equipped successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }
}

import {
  Alien,
  AlienPart,
  AlienPartType,
  DailyRewardType,
  ItemQuality,
  ItemType,
  RuneType,
} from '@prisma/client';
import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateAlienDTO } from './dto/profile.dto';
import {
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { CharacterService } from '../character/character.service';

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private characterService: CharacterService,
  ) {}

  private s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
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

      let isStarBoostActive = false;
      let isXpBoostActive = false;
      let isRaidBoostActive = false;
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

      if (createAlienDTO.eyesId) {
        const eyes = await this.prisma.alienPart.findUnique({
          where: { id: Number(createAlienDTO.eyesId) },
        });

        if (!eyes) {
          throw new BadRequestException('Eyes part not found');
        }
      }

      if (createAlienDTO.hairId) {
        const hair = await this.prisma.alienPart.findUnique({
          where: { id: Number(createAlienDTO.hairId) },
        });

        if (!hair) {
          throw new BadRequestException('Hair part not found');
        }
      }

      if (createAlienDTO.mouthId) {
        const mouth = await this.prisma.alienPart.findUnique({
          where: { id: Number(createAlienDTO.mouthId) },
        });

        if (!mouth) {
          throw new BadRequestException('Mouth part not found');
        }
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
          equipmentPower: 0,
          selected: true,
          user: {
            connect: { walletAddress },
          },
          eyes: {
            connect: { id: Number(createAlienDTO.eyesId) },
          },
          hair: {
            connect: { id: Number(createAlienDTO.hairId) },
          },
          mouth: {
            connect: { id: Number(createAlienDTO.mouthId) },
          },
        },
      });

      // Loop over all parts and forge them
      for (const part of [
        createAlienDTO.eyesId,
        createAlienDTO.hairId,
        createAlienDTO.mouthId,
      ]) {
        if (part) {
          await this.forgeDefaultAlienParts(
            walletAddress,
            part,
            createAlienDTO.elementId,
          );
        }
      }
      if (createAlienDTO.elementId) {
        const user = await this.prisma.user.findUnique({
          where: {
            walletAddress,
          },
        });

        await this.prisma.userElement.create({
          data: {
            userId: user.id,
            elementId: createAlienDTO.elementId,
          },
        });
      }

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
      let user = await this.prisma.user.findUnique({
        where: { walletAddress },
        include: {
          claimedDailyRewards: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Check if streak should be reset due to missed days
      let streakReset = false;
      if (user.lastDailyClaimed) {
        const lastClaimed = new Date(user.lastDailyClaimed);
        const lastClaimedUTC = new Date(
          Date.UTC(
            lastClaimed.getUTCFullYear(),
            lastClaimed.getUTCMonth(),
            lastClaimed.getUTCDate(),
          ),
        );

        const now = new Date();
        const today = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
        );

        const yesterday = new Date(today);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);

        // If last claimed is before yesterday, streak is broken
        if (lastClaimedUTC.getTime() < yesterday.getTime()) {
          // Reset streak
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              dailyStreak: 1,
              claimedDailyRewards: {
                set: [], // Clear all connections
              },
              claimedDailyRewardIds: [], // Reset the array
            },
          });

          // Refetch user with updated data
          const updatedUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            include: {
              claimedDailyRewards: true,
            },
          });

          // Update user reference for the return value
          user = updatedUser;
          streakReset = true;
        }
      }

      const dailyRewards = await this.prisma.dailyReward.findMany({
        orderBy: {
          id: 'asc',
        },
      });

      return {
        success: true,
        dailyRewards,
        dailyStreak: user.dailyStreak,
        lastDailyClaimed: user.lastDailyClaimed,
        claimedDailyRewards: user.claimedDailyRewards,
        claimedDailyRewardIds: user.claimedDailyRewardIds,
        streakReset: streakReset,
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
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
        include: {
          claimedDailyRewards: true, // Make sure to include this relation
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Create today's date in UTC
      const now = new Date();
      const today = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );

      // Check if user already claimed today
      if (user.lastDailyClaimed) {
        const lastClaimed = new Date(user.lastDailyClaimed);
        const lastClaimedUTC = new Date(
          Date.UTC(
            lastClaimed.getUTCFullYear(),
            lastClaimed.getUTCMonth(),
            lastClaimed.getUTCDate(),
          ),
        );

        if (lastClaimedUTC.getTime() === today.getTime()) {
          throw new BadRequestException('Daily reward already claimed today');
        }
      }

      // Determine which reward to give
      let nextRewardIndex = 0;
      let updatedStreak = 1;
      let streakBroken = false;
      let weeklyResetRequired = false;

      if (user.lastDailyClaimed) {
        const lastClaimed = new Date(user.lastDailyClaimed);
        const lastClaimedUTC = new Date(
          Date.UTC(
            lastClaimed.getUTCFullYear(),
            lastClaimed.getUTCMonth(),
            lastClaimed.getUTCDate(),
          ),
        );

        const yesterday = new Date(today);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);

        // If claimed yesterday, continue streak
        if (lastClaimedUTC.getTime() === yesterday.getTime()) {
          updatedStreak = user.dailyStreak + 1;

          // Check if we've completed a 6-day streak (this would be day 7)
          if (updatedStreak > 6) {
            // Reset streak after completing a full week
            updatedStreak = 1;
            weeklyResetRequired = true;
          } else {
            // Get the last claimed reward ID
            if (user.claimedDailyRewardIds.length > 0) {
              const lastClaimedRewardId =
                user.claimedDailyRewardIds[
                  user.claimedDailyRewardIds.length - 1
                ];

              // Get all daily rewards ordered by ID
              const allRewards = await this.prisma.dailyReward.findMany({
                orderBy: { id: 'asc' },
              });

              // Find index of last claimed reward
              const lastIndex = allRewards.findIndex(
                (r) => r.id === lastClaimedRewardId,
              );

              if (lastIndex !== -1) {
                // Get next reward (loop back to 0 if at the end)
                nextRewardIndex = (lastIndex + 1) % allRewards.length;
              }
            }
          }
        } else {
          // Streak broken, start from first reward
          updatedStreak = 1;
          streakBroken = true;
        }
      }

      // Get the reward to claim (either first or next in sequence)
      const dailyRewards = await this.prisma.dailyReward.findMany({
        orderBy: { id: 'asc' },
      });

      if (dailyRewards.length === 0) {
        throw new BadRequestException('No daily rewards available');
      }

      const dailyReward = dailyRewards[nextRewardIndex];

      // Apply the reward
      switch (dailyReward.type) {
        case DailyRewardType.STARS:
          await this.rewardStars(
            walletAddress,
            dailyReward.amount * updatedStreak,
          );
          break;
        case DailyRewardType.XP:
          await this.rewardXp(
            walletAddress,
            dailyReward.amount * updatedStreak,
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

      // Handle the update in a transaction to ensure consistency
      if (streakBroken || weeklyResetRequired) {
        // Reset the streak - clear all rewards and add the new one
        await this.prisma.$transaction([
          // First clear all existing relationships
          this.prisma.user.update({
            where: { id: user.id },
            data: {
              claimedDailyRewards: {
                set: [], // Clear all connections
              },
            },
          }),
          // Then update with the new data
          this.prisma.user.update({
            where: { id: user.id },
            data: {
              lastDailyClaimed: new Date(),
              dailyStreak: updatedStreak,
              claimedDailyRewards: {
                connect: { id: dailyReward.id },
              },
              claimedDailyRewardIds: [dailyReward.id],
            },
          }),
        ]);
      } else {
        // Continue the streak - just add the new reward
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            lastDailyClaimed: new Date(),
            dailyStreak: updatedStreak,
            claimedDailyRewards: {
              connect: { id: dailyReward.id },
            },
            claimedDailyRewardIds: {
              push: dailyReward.id,
            },
          },
        });
      }

      return {
        success: true,
        message: 'Reward claimed',
        rewardDetails: dailyReward,
        streak: updatedStreak,
        streakReset: streakBroken || weeklyResetRequired,
        weeklyResetCompleted: weeklyResetRequired,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || error,
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
    const traitFolders = ['Body', 'Elements', 'Eyes', 'Hair', 'Mouth'];
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
          boostAmount = 2;
          break;
        case ItemQuality.SILVER:
          boostAmount = 4;
          break;
        case ItemQuality.GOLDEN:
          boostAmount = 8;
          break;
      }

      await this.prisma.user.update({
        where: {
          walletAddress,
        },
        data: {
          ...(boostType === 'stars'
            ? {
                starsBoost: {
                  increment: boostAmount,
                },
                lastStarBoost: new Date(),
              }
            : {}),
          ...(boostType === 'raidTimeBoost'
            ? {
                raidTimeBoost: {
                  increment: boostAmount,
                },
                lastRaidBoost: new Date(),
              }
            : {}),
          ...(boostType === 'xpBoost'
            ? {
                xpBoost: {
                  increment: boostAmount,
                },
                lastXpBoost: new Date(),
              }
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

      const userCharacters = (
        await this.characterService.getUserCharacters(walletAddress)
      ).userCharacters;

      const aliens = await this.prisma.alien.findMany({
        where: {
          userId: user.id,
        },
      });
      for (const characterId of characterIds) {
        if (!userCharacters.some((character) => character.id === characterId)) {
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

      // Add selected characters and aliens to team
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          teamCharacterIds: {
            set: characterIds,
          },
          teamAlienIds: {
            set: alienIds,
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

  public async getTeam(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      let isStarBoostActive = false;
      let isXpBoostActive = false;
      let isRaidBoostActive = false;
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

      const userCharacterRequest =
        await this.characterService.getUserCharacters(walletAddress);

      if (!userCharacterRequest.success) {
        throw new BadRequestException(
          'Error fetching user characters: ' + userCharacterRequest.error,
        );
      }

      const userCharacters = userCharacterRequest.userCharacters;

      const teamCharacters = userCharacters.filter((character) =>
        user.teamCharacterIds.includes(character.id),
      );
      const teamAliens = await this.prisma.alien.findMany({
        where: {
          userId: user.id,
          id: { in: user.teamAlienIds },
        },
        include: {
          element: true,
        },
      });

      if (teamAliens.length < 1) {
        const userAlien = await this.prisma.alien.findFirst({
          where: {
            userId: user.id,
          },
          include: {
            element: true,
          },
        });
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            teamAlienIds: {
              set: [userAlien.id],
            },
          },
        });
        if (userAlien) {
          teamAliens.push(userAlien);
        }
      }

      // const characters = await this.prisma.userCharacter.findMany({
      //   where: {
      //     userId: user.id,
      //     onTeam: true,
      //   },
      //   include: {
      //     character: {
      //       include: {
      //         element: true,
      //       },
      //     },
      //   },
      // });

      // const aliens = await this.prisma.alien.findMany({
      //   where: {
      //     userId: user.id,
      //     onTeam: true,
      //   },
      //   include: {
      //     element: true,
      //   },
      // });

      let teamStrengthPoints = 0;
      const synergies = {};
      const teamResponse = [];
      for (const character of teamCharacters) {
        teamStrengthPoints += character.power;
        synergies[character.element.name] =
          synergies[character.element.name] || 0;
        synergies[character.element.name] += 1;
        teamResponse.push({
          id: character.id,
          name: character.name,
          strengthPoints: character.power,
          element: character.element,
          image: character.image,
          type: 'character',
        });
      }
      for (const alien of teamAliens) {
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
        error: error.message,
      };
    }
  }

  public async getEquippedAlienParts(
    walletAddress: string,
    alienId: number,
  ): Promise<{
    success?: boolean;
    parts?: {
      body: AlienPart;
      clothes: AlienPart;
      head: AlienPart;
      eyes: AlienPart;
      mouth: AlienPart;
      hair: AlienPart;
      marks: AlienPart;
      powers: AlienPart;
      accessories: AlienPart;
      background: Element;
    };
    error?: string;
  }> {
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
          element: true,
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
        background: alien.element,
      };

      return {
        success: true,
        parts: {
          ...parts,
          background: parts.background as unknown as Element,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
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

      const elements = await this.prisma.userElement.findMany({
        where: {
          userId: user.id,
        },
        include: {
          element: true,
        },
      });

      const elementsArray = elements.map((element) => element.element);

      return {
        success: true,
        userAlienParts,
        elements: elementsArray,
      };
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
    parts: { type: string; id: number }[],
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.stars < 150) {
        return {
          success: false,
          message:
            "You don't have enough stars. 150 stars required to equip parts.",
        };
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

      const userAlienPartGroup = await this.prisma.alienPartGroup.findMany({
        where: {
          userId: user.id,
        },
        include: {
          parts: true,
        },
      });

      // Get user's elements
      const userElements = await this.prisma.userElement.findMany({
        where: {
          userId: user.id,
        },
        select: {
          elementId: true,
        },
      });

      const userElementIds = userElements.map((ue) => ue.elementId);

      const userAlienParts = userAlienPartGroup.flatMap((group) => group.parts);

      // Map from frontend part type to database field
      const partTypeToFieldMap = {
        hair: 'hairId',
        eyes: 'eyesId',
        mouth: 'mouthId',
        element: 'elementId',
        body: 'bodyId',
        clothes: 'clothesId',
        head: 'headId',
        marks: 'marksId',
        powers: 'powersId',
        accessories: 'accessoriesId',
      };

      // Map from frontend part type to database part type (for validation)
      const partTypeToDbTypeMap = {
        hair: 'HAIR',
        eyes: 'EYES',
        mouth: 'MOUTH',
        body: 'BODY',
        clothes: 'CLOTHES',
        head: 'HEAD',
        marks: 'MARKS',
        powers: 'POWERS',
        accessories: 'ACCESSORIES',
      };

      // Prepare update data
      const updateData = {};

      // Process each part with its type
      for (const part of parts) {
        const { type, id } = part;

        // Handle element type separately
        if (type === 'element') {
          if (!userElementIds.includes(id)) {
            throw new BadRequestException(
              `Element with ID ${id} not found in user inventory`,
            );
          }

          // Update the element
          updateData['elementId'] = id;
          continue;
        }

        // For other part types
        const dbField = partTypeToFieldMap[type];

        if (!dbField) {
          throw new BadRequestException(`Invalid part type: ${type}`);
        }

        // Find the part in the database
        const dbPart = await this.prisma.alienPart.findUnique({
          where: { id },
        });

        if (!dbPart) {
          throw new BadRequestException(`Alien part with ID ${id} not found`);
        }

        // Verify the part type matches what we expect
        const expectedDbType = partTypeToDbTypeMap[type];

        if (dbPart.type !== expectedDbType) {
          throw new BadRequestException(
            `Part ID ${id} is not of type ${type} (found ${dbPart.type})`,
          );
        }

        // Verify the user owns this part
        if (!userAlienParts.some((userPart) => userPart.id === id)) {
          throw new BadRequestException(
            `Alien part with ID ${id} not found in user inventory`,
          );
        }

        // Add to update data
        updateData[dbField] = id;
      }

      // Update the alien with all the new parts in a single operation
      const updatedAlien = await this.prisma.alien.update({
        where: { id: alien.id },
        data: updateData,
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
          element: true,
        },
      });

      // Deduct stars from user after successful equipping
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          stars: {
            decrement: 150,
          },
        },
      });

      return {
        success: true,
        message: `${parts.length} parts equipped successfully`,
        alien: updatedAlien,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to equip parts',
        error,
      };
    }
  }

  public async equipAlienPartOld(
    walletAddress: string,
    alienId: number,
    partIds: number[],
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.stars < 150) {
        return {
          success: false,
          message:
            "You don't have enough stars. 150 stars required to equip parts.",
        };
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

      const userAlienPartGroup = await this.prisma.alienPartGroup.findMany({
        where: {
          userId: user.id,
        },
        include: {
          parts: true,
        },
      });

      // Get user's elements
      const userElements = await this.prisma.userElement.findMany({
        where: {
          userId: user.id,
        },
        select: {
          elementId: true,
        },
      });

      const userElementIds = userElements.map((ue) => ue.elementId);

      const userAlienParts = userAlienPartGroup.flatMap((group) => group.parts);

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
      };

      // Prepare update data
      const updateData = {};

      // Process each part ID
      for (const partId of partIds) {
        // First check if it's an element
        const element = await this.prisma.element.findUnique({
          where: { id: partId },
        });

        if (element) {
          // This is an element ID
          if (!userElementIds.includes(partId)) {
            throw new BadRequestException(
              `Element with ID ${partId} not found in user inventory`,
            );
          }

          // Update the element
          updateData['elementId'] = partId;
          continue; // Skip to next iteration
        }

        const part = await this.prisma.alienPart.findUnique({
          where: { id: partId },
        });

        if (!part) {
          throw new BadRequestException(
            `Alien part with ID ${partId} not found`,
          );
        }

        if (!userAlienParts.some((userPart) => userPart.id === partId)) {
          throw new BadRequestException(
            `Alien part with ID ${partId} not found in user inventory`,
          );
        }

        const partField = partFieldMap[part.type];

        if (!partField) {
          throw new BadRequestException(
            `Invalid part type for part ID ${partId}`,
          );
        }

        // Add to update data
        updateData[partField] = part.id;
      }

      // Update the alien with all the new parts in a single operation
      const updatedAlien = await this.prisma.alien.update({
        where: { id: alien.id },
        data: updateData,
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
          element: true,
        },
      });

      // Deduct stars from user after successful equipping
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          stars: {
            decrement: 150,
          },
        },
      });

      // TODO: Update alien image with new equipped parts by updating the metadata and then generating a new image

      return {
        success: true,
        message: `${partIds.length} parts equipped successfully`,
        alien: updatedAlien,
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  public async updateAlienImage(
    walletAddress: string,
    alienId: number,
    image: Express.Multer.File,
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
          id: Number(alienId),
          userId: user.id,
        },
      });

      if (!alien) {
        throw new BadRequestException(
          'Alien not found or does not belong to this user',
        );
      }

      // Upload new image to S3
      try {
        const uploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `aliens/${alien.id}_${alien.name}.png`,
          Body: image.buffer,
          ContentType: 'image/png',
        };
        const uploadCommand = new PutObjectCommand(uploadParams);
        await this.s3.send(uploadCommand);
      } catch (error) {
        console.error(`Error uploading image to S3: ${error}`);
        throw new BadRequestException('Failed to upload image to S3');
      }

      // Update alien record with new image URL
      const updatedAlien = await this.prisma.alien.update({
        where: {
          id: alien.id,
        },
        data: {
          image: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/aliens/${alien.id}_${alien.name}.png`,
        },
      });

      return {
        success: true,
        alien: updatedAlien,
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  public async getForgeParts(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const commonRunes = user.runes.filter((rune) => rune === RuneType.COMMON);
      const uncommonRunes = user.runes.filter(
        (rune) => rune === RuneType.UNCOMMON,
      );
      const rareRunes = user.runes.filter((rune) => rune === RuneType.RARE);
      const epicRunes = user.runes.filter((rune) => rune === RuneType.EPIC);
      const legendaryRunes = user.runes.filter(
        (rune) => rune === RuneType.LEGENDARY,
      );

      const alienParts = await this.prisma.alienPart.findMany({
        where: {
          isForgeable: true,
        },
      });

      if (!alienParts || alienParts.length === 0) {
        throw new BadRequestException('Alien parts not found');
      }

      const alienPartData = alienParts.map((part) => {
        return {
          id: part.id,
          name: part.name,
          description: part.description,
          power: part.power,
          type: part.type,
          image: part.image,
          forgeRuneType: part.forgeRuneType,
          forgeRuneAmount: part.forgeRuneAmount,
        };
      });

      const userRuneData = {
        [RuneType.COMMON]: commonRunes.length,
        [RuneType.UNCOMMON]: uncommonRunes.length,
        [RuneType.RARE]: rareRunes.length,
        [RuneType.EPIC]: epicRunes.length,
        [RuneType.LEGENDARY]: legendaryRunes.length,
      };

      return {
        success: true,
        alienParts: alienPartData,
        userRuneAmounts: userRuneData,
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async forgeParts(
    walletAddress: string,
    alienPartId: number,
  ): Promise<{
    success: boolean;
    message?: string;
    error?: any;
  }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          walletAddress,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const alienPart = await this.prisma.alienPart.findUnique({
        where: {
          id: alienPartId,
        },
      });

      if (!alienPart) {
        throw new BadRequestException('Alien part not found');
      }

      // Check if the user already has this part
      const existingPartGroup = await this.prisma.alienPartGroup.findFirst({
        where: {
          userId: user.id,
          parts: {
            some: {
              id: alienPartId,
            },
          },
        },
      });

      if (existingPartGroup) {
        return {
          success: false,
          message: `You already own the ${alienPart.name}`,
        };
      }

      const runeType = alienPart.forgeRuneType;
      const runeAmount = alienPart.forgeRuneAmount;

      if (!runeType || !runeAmount) {
        throw new BadRequestException('Alien part cannot be forged');
      }

      const userRunes = user.runes.filter((rune) => rune === runeType);

      if (userRunes.length < runeAmount) {
        throw new BadRequestException(
          `Insufficient ${runeType} runes. Required: ${runeAmount} ${runeType} runes`,
        );
      }

      // Create a new runes array by removing only the required amount of the specific rune type
      const newRunes = [...user.runes];
      let removedCount = 0;

      for (let i = newRunes.length - 1; i >= 0; i--) {
        if (newRunes[i] === runeType && removedCount < runeAmount) {
          newRunes.splice(i, 1);
          removedCount++;
        }

        if (removedCount === runeAmount) {
          break;
        }
      }

      // Deduct runes from user
      await this.prisma.user.update({
        where: {
          walletAddress,
        },
        data: {
          runes: newRunes,
        },
      });

      // Create a new alien part for the user
      await this.prisma.alienPartGroup.upsert({
        where: {
          id: alienPartId,
        },
        update: {
          parts: {
            connect: {
              id: alienPartId,
            },
          },
        },
        create: {
          name: alienPart.name,
          description: alienPart.description,
          parts: {
            connect: {
              id: alienPartId,
            },
          },
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      });

      return {
        success: true,
        message: `Successfully forged ${alienPart.name} part.`,
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async forgePartsOld(
    walletAddress: string,
    alienPartId: number,
  ): Promise<{
    success: boolean;
    error?: any;
  }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          walletAddress,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const alienPart = await this.prisma.alienPart.findUnique({
        where: {
          id: alienPartId,
        },
      });

      if (!alienPart) {
        throw new BadRequestException('Alien part not found');
      }

      const runeType = alienPart.forgeRuneType;
      const runeAmount = alienPart.forgeRuneAmount;

      if (!runeType || !runeAmount) {
        throw new BadRequestException('Alien part cannot be forged');
      }

      const userRunes = user.runes.filter((rune) => rune === runeType);

      if (userRunes.length < runeAmount) {
        throw new BadRequestException(
          `Insufficient ${runeType} runes. Required: ${runeAmount} ${runeType} runes`,
        );
      }

      const newUserRuneList = [];
      let i = 0;
      for (const rune of userRunes) {
        if (rune !== runeType || i >= runeAmount) {
          newUserRuneList.push(rune);
        } else {
          i++;
        }
      }

      // Deduct runes from user
      await this.prisma.user.update({
        where: {
          walletAddress,
        },
        data: {
          runes: newUserRuneList,
        },
      });

      // Create a new alien part for the user
      await this.prisma.alienPartGroup.upsert({
        where: {
          id: alienPartId,
        },
        update: {
          parts: {
            connect: {
              id: alienPartId,
            },
          },
        },
        create: {
          name: alienPart.name,
          description: alienPart.description,
          parts: {
            connect: {
              id: alienPartId,
            },
          },
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      });

      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async forgeDefaultAlienParts(
    walletAddress: string,
    alienPartId: number,
    elementId: number,
  ): Promise<{
    success: boolean;
    error?: any;
  }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          walletAddress,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const alienPart = await this.prisma.alienPart.findUnique({
        where: {
          id: alienPartId,
        },
      });

      // Create a new alien part for the user
      await this.prisma.alienPartGroup.upsert({
        where: {
          id: alienPartId,
        },
        update: {
          elementId: elementId || null,
          parts: {
            connect: {
              id: alienPartId,
            },
          },
        },
        create: {
          name: alienPart.name,
          description: alienPart.description,
          parts: {
            connect: {
              id: alienPartId,
            },
          },
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      });

      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async getDefaultAlienParts(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const alienParts = await this.prisma.alienPart.findMany({
        where: {
          isDefault: true,
          isForgeable: false,
          type: {
            in: [AlienPartType.HAIR, AlienPartType.EYES, AlienPartType.MOUTH],
          },
        },
      });

      if (!alienParts || alienParts.length === 0) {
        throw new BadRequestException('Alien parts not found');
      }

      const alienPartData = alienParts.map((part) => {
        return {
          id: part.id,
          name: part.name,
          description: part.description,
          type: part.type,
          image: part.image,
        };
      });

      return {
        success: true,
        alienParts: alienPartData,
      };
    } catch (error) {
      return { success: false, error };
    }
  }
}

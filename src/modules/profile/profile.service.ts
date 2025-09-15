import {
  Alien,
  AlienPart,
  AlienPartType,
  DailyRewardType,
  ItemQuality,
  ItemType,
  RuneType,
  Prisma,
  Element,
} from '@prisma/client';
import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateAlienDTO } from './dto/profile.dto';
import {
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { StoreService } from '../store/store.service';
import { CharacterService } from '../character/character.service';

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private storeService: StoreService,
    private characterService: CharacterService,
  ) {}

  private s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  public async getProfile(walletAddress: string, privyId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      include: {
        aliens: {
          include: {
            element: true,
            eyes: true,
            hair: true,
            mouth: true,
          },
        },
        UserElement: {
          include: {
            element: true,
          },
        },
      },
    });

    if (privyId) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { privyId: privyId },
      });
    }

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
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
        new Date().getTime() - user.lastXpBoost.getTime() < 24 * 60 * 60 * 1000;
    }
    if (user.raidTimeBoost > 0) {
      isRaidBoostActive =
        new Date().getTime() - user.lastRaidBoost.getTime() <
        24 * 60 * 60 * 1000;
    }

    const totalReferrals = await this.prisma.user.count({
      where: {
        referrerId: user.id,
      },
    });

    return {
      success: true,
      id: user.id,
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
      email: user.email,
      privyId: user.privyId,
      totalReferrals,
      likedUserIds: user.likedUserIds,
      createdAt: user.createdAt,
      starsBoost: isStarBoostActive ? user.starsBoost : 0,
      xpBoost: isXpBoostActive ? user.xpBoost : 0,
      raidTimeBoost: isRaidBoostActive ? user.raidTimeBoost : 0,
      claimedDailyRewardIds: user.claimedDailyRewardIds,
      aliens: user.aliens,
      elements: user.UserElement.map((ue) => ue.element),
    };
  }

  public async createAlien(
    walletAddress: string,
    createAlienDTO: CreateAlienDTO,
    image: Express.Multer.File,
  ) {
    try {
      // Validate required fields
      if (
        !createAlienDTO.name ||
        !createAlienDTO.elementId ||
        createAlienDTO.elementId <= 0 ||
        !createAlienDTO.eyesId ||
        createAlienDTO.eyesId <= 0 ||
        !createAlienDTO.hairId ||
        createAlienDTO.hairId <= 0 ||
        !createAlienDTO.mouthId ||
        createAlienDTO.mouthId <= 0
      ) {
        return {
          success: false,
          error: 'Missing or invalid required fields',
        };
      }

      // Find the user
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Validate element exists
      const element = await this.prisma.element.findUnique({
        where: {
          id: Number(createAlienDTO.elementId),
        },
      });

      if (!element) {
        return {
          success: false,
          error: 'Element not found',
        };
      }

      // Validate all required parts exist and are of correct type
      const [eyes, hair, mouth] = await Promise.all([
        this.prisma.alienPart.findUnique({
          where: { id: Number(createAlienDTO.eyesId) },
        }),
        this.prisma.alienPart.findUnique({
          where: { id: Number(createAlienDTO.hairId) },
        }),
        this.prisma.alienPart.findUnique({
          where: { id: Number(createAlienDTO.mouthId) },
        }),
      ]);

      if (!eyes || eyes.type !== 'EYES') {
        return {
          success: false,
          error: 'Invalid or missing eyes part',
        };
      }

      if (!hair || hair.type !== 'HAIR') {
        return {
          success: false,
          error: 'Invalid or missing hair part',
        };
      }

      if (!mouth || mouth.type !== 'MOUTH') {
        return {
          success: false,
          error: 'Invalid or missing mouth part',
        };
      }

      const totalPower =
        (eyes.power || 0) + (hair.power || 0) + (mouth.power || 0);

      // First create the alien with a transaction
      const alien = await this.prisma.$transaction(
        async (prisma) => {
          return await prisma.alien.create({
            data: {
              name: createAlienDTO.name,
              element: {
                connect: {
                  id: Number(createAlienDTO.elementId),
                },
              },
              strengthPoints: Number(createAlienDTO.strengthPoints),
              equipmentPower: totalPower,
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
            include: {
              element: true,
              eyes: true,
              hair: true,
              mouth: true,
            },
          });
        },
        {
          timeout: 10000, // 10 second timeout
        },
      );

      // Then create alien part groups in a separate transaction
      await this.prisma.$transaction(
        async (prisma) => {
          const partIds = [
            createAlienDTO.eyesId,
            createAlienDTO.hairId,
            createAlienDTO.mouthId,
          ];

          // Create user-element relationship
          await prisma.userElement.create({
            data: {
              userId: user.id,
              elementId: createAlienDTO.elementId,
            },
          });

          // Create alien part groups
          for (const partId of partIds) {
            const part = await prisma.alienPart.findUnique({
              where: { id: Number(partId) },
              select: {
                id: true,
                name: true,
                description: true,
                availability: true,
              },
            });

            if (part) {
              // Get current availability and update it
              const currentAvailability = (part.availability || []) as {
                userId: number;
                available: number;
              }[];
              const existingUserAvailability = currentAvailability.find(
                (a) => a.userId === user.id,
              );

              if (existingUserAvailability) {
                // Update existing availability
                await prisma.alienPart.update({
                  where: { id: Number(partId) },
                  data: {
                    availability: currentAvailability.map((a) =>
                      a.userId === user.id ? { ...a, available: 1.0 } : a,
                    ),
                  },
                });
              } else {
                // Add new availability entry
                await prisma.alienPart.update({
                  where: { id: Number(partId) },
                  data: {
                    availability: [
                      ...currentAvailability,
                      { userId: user.id, available: 1.0 },
                    ],
                  },
                });
              }

              await prisma.alienPartGroup.create({
                data: {
                  name: part.name,
                  description: part.description,
                  parts: {
                    connect: {
                      id: partId,
                    },
                  },
                  user: {
                    connect: {
                      id: user.id,
                    },
                  },
                  element: element
                    ? {
                        connect: {
                          id: element.id,
                        },
                      }
                    : undefined,
                },
              });
            }
          }
        },
        {
          timeout: 10000, // 10 second timeout
        },
      );

      // Upload image to s3 outside of any transaction
      let imageUrl = null;
      try {
        const uploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `aliens/${alien.id}_${createAlienDTO.name}.png`,
          Body: image.buffer,
          ContentType: 'image/png',
        };
        const uploadCommand = new PutObjectCommand(uploadParams);
        await this.s3.send(uploadCommand);
        imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/aliens/${alien.id}_${createAlienDTO.name}.png`;

        // Update alien with image URL in a separate operation
        await this.prisma.alien.update({
          where: { id: alien.id },
          data: { image: imageUrl },
        });
      } catch (error) {
        console.error(`Error uploading image to S3: ${error}`);
        // Don't throw here, we'll still return the alien even if image upload fails
      }

      return {
        success: true,
        alien: {
          ...alien,
          image: imageUrl,
        },
      };
    } catch (error) {
      console.error('Error in createAlien:', error);
      return {
        success: false,
        error: error.message || 'Failed to create alien',
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

  private getWeekDates(date: Date) {
    const targetDate = new Date(date);

    // Calculate Friday (start of the week)
    const weekStarting = new Date(targetDate);
    const daysToFriday = (targetDate.getDay() + 2) % 7;
    weekStarting.setDate(targetDate.getDate() - daysToFriday);
    weekStarting.setHours(0, 0, 0, 0);

    // Calculate Thursday (end of the week)
    const weekEnding = new Date(weekStarting);
    weekEnding.setDate(weekStarting.getDate() + 6); // Add 6 days to get to Thursday
    weekEnding.setHours(23, 59, 59, 999);

    return { weekStarting, weekEnding };
  }

  public async getLeaderboard(
    walletAddress: string,
    offset: number,
    limit: number,
    filter: string,
    search: string,
    date?: string,
  ) {
    let users = [];
    let historicalReputations = null;

    // If date is provided, get historical data
    if (date) {
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        throw new BadRequestException(
          'Invalid date format. Please use YYYY-MM-DD',
        );
      }

      const { weekStarting, weekEnding } = this.getWeekDates(targetDate);

      console.log('==== weekStarting, weekEnding ====');
      console.log(weekStarting, weekEnding);
      console.log('==== weekStarting, weekEnding ====');

      // Get historical reputation data for the week
      historicalReputations =
        await this.prisma.weeklyReputationHistory.findMany({
          where: {
            weekStarting,
            weekEnding,
          },
          select: {
            userId: true,
            points: true,
          },
        });

      // No need to throw error if no historical data, just return empty results
      if (historicalReputations.length === 0) {
        return {
          users: [],
          thisUser: null,
        };
      }
    }

    // Base query conditions
    const baseWhere: any = {};
    if (search) {
      if (filter === 'enterprises') {
        baseWhere.enterprise = {
          contains: search,
          mode: 'insensitive',
        };
      } else {
        baseWhere.name = {
          contains: search,
          mode: 'insensitive',
        };
      }
    }

    if (filter === 'likes') {
      const likedUserIds =
        (
          await this.prisma.user.findUnique({
            where: { walletAddress },
            select: {
              likedUserIds: true,
            },
          })
        )?.likedUserIds || [];

      baseWhere.id = { in: likedUserIds };
    }

    // Get users based on filter
    users =
      (await this.prisma.user.findMany({
        where: baseWhere,
        orderBy: { reputation: 'desc' },
        skip: offset,
        // take: limit, // TODO: uncomment this
        include: {
          aliens: {
            include: {
              element: true,
              eyes: true,
              hair: true,
              mouth: true,
            },
          },
          UserElement: {
            include: {
              element: true,
            },
          },
        },
      })) || [];

    const currentUser = await this.prisma.user.findUnique({
      where: { walletAddress },
      include: {
        aliens: {
          include: {
            element: true,
            eyes: true,
            hair: true,
            mouth: true,
          },
        },
        UserElement: {
          include: {
            element: true,
          },
        },
      },
    });

    if (!currentUser) {
      return {
        users: [],
        thisUser: null,
      };
    }

    let currentUserRank = null;
    const currentUserHistoricalRep =
      historicalReputations?.find((r) => r.userId === currentUser.id)?.points ??
      0;

    // Calculate rank based on historical or current data
    if (historicalReputations) {
      currentUserRank =
        historicalReputations
          .sort((a, b) => b.points - a.points)
          .findIndex((r) => r.userId === currentUser.id) + 1;
    } else {
      const whereRank = { ...baseWhere };
      whereRank.reputation = { gt: currentUser.reputation };
      currentUserRank =
        (await this.prisma.user.count({ where: whereRank })) + 1;
    }

    const likedUserIds =
      (
        await this.prisma.user.findUnique({
          where: { walletAddress: currentUser.walletAddress },
          select: {
            likedUserIds: true,
          },
        })
      )?.likedUserIds || [];

    // If using historical data, sort users by their historical reputation
    if (historicalReputations && users.length > 0) {
      users = users
        .map((user) => ({
          ...user,
          reputation:
            historicalReputations.find((r) => r.userId === user.id)?.points ??
            0,
        }))
        .sort((a, b) => b.reputation - a.reputation);
    }

    return {
      users: users.map((user, index) => ({
        id: user.privyId,
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
        aliens: user.aliens,
        elements: user.UserElement.map((ue) => ue.element),
      })),
      thisUser: users.some(
        (user) => user.walletAddress === currentUser.walletAddress,
      )
        ? undefined
        : {
            id: currentUser.id,
            name: currentUser.name,
            country: currentUser.country,
            enterprise: currentUser.enterprise,
            image: currentUser.image,
            level: currentUser.level,
            experience: currentUser.experience,
            reputation: historicalReputations
              ? currentUserHistoricalRep
              : currentUser.reputation,
            rank: currentUserRank,
            stars: currentUser.stars,
            createdAt: currentUser.createdAt,
            aliens: currentUser.aliens,
            elements: currentUser.UserElement.map((ue) => ue.element),
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

      console.log('alreadyLiked ====>', alreadyLiked);

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
      const streakLimit = 28;

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
          if (updatedStreak > streakLimit) {
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
            dailyReward.totalAmount,
            // dailyReward.amount * updatedStreak,
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

  public async getTeam(walletAddress: string, raidId?: number | null) {
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
          hair: true,
          eyes: true,
          mouth: true,
          body: true,
          clothes: true,
          head: true,
          marks: true,
          powers: true,
          accessories: true,
        },
      });

      if (teamAliens.length < 1) {
        const userAlien = await this.prisma.alien.findFirst({
          where: {
            userId: user.id,
          },
          include: {
            element: true,
            hair: true,
            eyes: true,
            mouth: true,
            body: true,
            clothes: true,
            head: true,
            marks: true,
            powers: true,
            accessories: true,
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
          teamImage: character.teamImage,
          type: 'character',
        });
      }

      // Calculate alien part boosts
      const alienPartTotalBoosts = {
        starBoost: 0,
        xpBoost: 0,
        raidTimeBoost: 0,
      };

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

        // Map from frontend part type to current alien part
        const currentPartsMap = {
          hair: alien.hair,
          eyes: alien.eyes,
          mouth: alien.mouth,
          body: alien.body,
          clothes: alien.clothes,
          head: alien.head,
          marks: alien.marks,
          powers: alien.powers,
          accessories: alien.accessories,
        };

        // Sum up current boosts
        Object.values(currentPartsMap).forEach((part) => {
          if (part) {
            alienPartTotalBoosts.starBoost += part.starBoost || 0;
            alienPartTotalBoosts.xpBoost += part.xpBoost || 0;
            alienPartTotalBoosts.raidTimeBoost += part.raidTimeBoost || 0;
          }
        });
      }

      var elementRaidTimeBoost = 0;

      if (raidId) {
        console.log(`RaidId: ${raidId}`);
        const raid = await this.prisma.raid.findUnique({
          where: {
            id: raidId,
          },
          include: {
            element: true,
          },
        });

        if (!raid) {
          throw new BadRequestException('Invalid raid id');
        }

        const raidElementId = raid.element.id;

        for (const member of teamResponse) {
          if (member.element.weaknessId === raidElementId) {
            elementRaidTimeBoost -= 2;
          } else if (member.element.strengthId === raidElementId) {
            elementRaidTimeBoost += 2;
          }
        }
      }

      const totalBoosts = {
        starBoost:
          (isStarBoostActive ? user.starsBoost : 0) +
          alienPartTotalBoosts.starBoost,
        xpBoost:
          (isXpBoostActive ? user.xpBoost : 0) + alienPartTotalBoosts.xpBoost,
        raidTimeBoost:
          (isRaidBoostActive ? user.raidTimeBoost : 0) +
          alienPartTotalBoosts.raidTimeBoost +
          elementRaidTimeBoost,
      };

      return {
        success: true,
        teamStrengthPoints: teamStrengthPoints,
        team: teamResponse.reverse(),
        synergies: synergies,
        buffs: {
          starsBoost: totalBoosts.starBoost,
          xpBoost: totalBoosts.xpBoost,
          raidTimeBoost: -totalBoosts.raidTimeBoost, // Return raid time effect instead of boost
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
      element: Element;
      background: AlienPart;
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
          background: true,
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
        element: alien.element,
        background: alien.background,
      };

      return {
        success: true,
        parts: {
          ...parts,
          element: parts.element as unknown as Element,
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

      const userAlienPartGroups = await this.prisma.alienPartGroup.findMany({
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

      // Fetch owned wearables and their associated alien parts
      const ownedWearables = await this.storeService.getUserWearables(
        walletAddress,
      );

      // Create a Map to track unique parts by their ID
      const uniquePartsMap = new Map();

      // First add all parts from userAlienPartGroups
      userAlienPartGroups.forEach((group) => {
        group.parts.forEach((part) => {
          if (!uniquePartsMap.has(part.id)) {
            uniquePartsMap.set(part.id, part);
          }
        });
      });

      // Create a Map to track unique groups by a composite key (name + type)
      const uniqueGroupsMap = new Map();

      // Add user alien part groups first
      userAlienPartGroups.forEach((group) => {
        const key = `${group.name}_${group.parts[0]?.type}`;

        if (!uniqueGroupsMap.has(key)) {
          uniqueGroupsMap.set(key, group);
        }
      });

      // Add wearable groups, combining quantities if the same part exists
      ownedWearables.forEach((wearable) => {
        const part = wearable.alienPart;
        if (!part) return;

        // Add to unique parts if not already present
        if (!uniquePartsMap.has(part.id)) {
          uniquePartsMap.set(part.id, part);
        }

        const key = `${part.name}_${part.type}`;
        const existingGroup = uniqueGroupsMap.get(key);

        if (existingGroup) {
          // If group exists, update the balance/quantity
          existingGroup.quantity =
            (existingGroup.quantity || 1) + wearable.balance;
        } else {
          // Create new group
          uniqueGroupsMap.set(key, {
            id: part.id,
            name: part.name,
            type: part.type,
            image: part.image,
            isDefault: part.isDefault,
            parts: [part],
            quantity: wearable.balance,
            createdAt: part.createdAt,
            updatedAt: part.updatedAt,
          });
        }
      });

      // Convert Maps back to arrays
      const uniqueGroups = Array.from(uniqueGroupsMap.values());
      const uniqueParts = Array.from(uniquePartsMap.values());

      return {
        success: true,
        userAlienParts: uniqueGroups,
        elements: elementsArray,
        alienPartsList: uniqueParts,
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  public async getDojoOwnedAlienParts(walletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const userAlienPartGroups = await this.prisma.alienPartGroup.findMany({
        where: {
          userId: user.id,
        },
        include: {
          parts: true,
        },
      });
      // Filter groups to only include parts where user has availability 1 or greater
      const filteredUserAlienPartGroups = userAlienPartGroups
        .map((group) => ({
          ...group,
          parts: group.parts.filter((part) => {
            console.log('part ===>', part);
            const availability = part.availability as {
              userId: number;
              available: number;
            }[];
            return availability?.some(
              (a) => a.userId === user.id && Number(a.available) >= 1,
            );
          }),
        }))
        .filter((group) => group.parts.length > 0); // Remove groups with no available parts

      const elements = await this.prisma.userElement.findMany({
        where: {
          userId: user.id,
        },
        include: {
          element: true,
        },
      });

      const elementsArray = elements.map((element) => element.element);

      // Fetch owned wearables and their associated alien parts
      const ownedWearables = await this.storeService.getUserWearables(
        walletAddress,
      );

      // Convert wearableAlienParts to the same structure as userAlienPartGroups
      const wearableAlienPartGroups = [];
      for (const wearable of ownedWearables) {
        const part = wearable.alienPart;

        if (part) {
          for (let i = 0; i < wearable.balance; i++) {
            wearableAlienPartGroups.push({
              id: part.id,
              name: part.name,
              type: part.type,
              image: part.image,
              isDefault: part.isDefault,
              parts: [part],
              quantity: wearable.balance,
              createdAt: part.createdAt,
              updatedAt: part.updatedAt,
            });
          }
        }
      }

      // Combine filtered userAlienParts and wearableAlienParts into a single array
      const userAlienParts = [
        ...filteredUserAlienPartGroups,
        ...wearableAlienPartGroups,
      ];

      console.log('total userAlienParts ===>', userAlienParts.length);

      // Create a Set to track unique part IDs and filter out duplicates
      const uniquePartIds = new Set();
      const uniqueAlienPartsList = [
        ...filteredUserAlienPartGroups.flatMap((group) => group.parts),
        ...wearableAlienPartGroups.flatMap((group) => group.parts),
      ].filter((part) => {
        if (uniquePartIds.has(part.id)) {
          return false;
        }

        uniquePartIds.add(part.id);
        return true;
      });

      return {
        success: true,
        userAlienParts,
        elements: elementsArray,
        alienPartsList: uniqueAlienPartsList,
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
          background: true,
        },
      });

      console.log('alien ===>', alienId, user.id);

      if (!alien) {
        throw new BadRequestException('Alien not found');
      }

      // Get user's owned alien parts and elements
      const ownedAlienParts = await this.getOwnedAlienParts(walletAddress);

      if (!ownedAlienParts.success) {
        throw new BadRequestException(ownedAlienParts.error);
      }

      const {
        elements: userElements,
        userAlienParts,
        alienPartsList,
      } = ownedAlienParts;

      const userElementIds = userElements.map((ue) => ue.id);

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
        background: 'backgroundId',
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
        background: 'BACKGROUND',
      };

      // Map from frontend part type to current alien part
      const currentPartsMap = {
        hair: alien.hair,
        eyes: alien.eyes,
        mouth: alien.mouth,
        body: alien.body,
        clothes: alien.clothes,
        head: alien.head,
        marks: alien.marks,
        powers: alien.powers,
        accessories: alien.accessories,
        background: alien.background,
      };

      // Prepare update data
      const updateData = {};

      // Calculate current total boosts
      const currentTotalBoosts = {
        starBoost: 0,
        xpBoost: 0,
        raidTimeBoost: 0,
        power: 0,
      };

      // Sum up current boosts
      Object.values(currentPartsMap).forEach((part) => {
        if (part) {
          currentTotalBoosts.starBoost += part.starBoost || 0;
          currentTotalBoosts.xpBoost += part.xpBoost || 0;
          currentTotalBoosts.raidTimeBoost += part.raidTimeBoost || 0;
          currentTotalBoosts.power += part.power || 0;
        }
      });

      // Track new total boosts
      const newTotalBoosts = {
        starBoost: 0,
        xpBoost: 0,
        raidTimeBoost: 0,
        power: 0,
      };

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

        // Special case: ID 111111 means remove the part
        if (id === 111111) {
          // Set the field to null to remove the part
          updateData[dbField] = null;
          continue;
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
        if (!alienPartsList.some((userPart) => userPart.id === id)) {
          throw new BadRequestException(
            `Alien part with ID ${id} not found in user inventory`,
          );
        }

        if (
          userAlienParts.some(
            (userPart) =>
              userPart.id === id &&
              userPart.quantity !== undefined &&
              userPart.quantity < 1,
          )
        ) {
          const relevantPart = userAlienParts.find(
            (userPart) => userPart.id === id,
          );
          throw new BadRequestException(
            `Not enough balance for alien part: ${relevantPart?.name}. You have ${relevantPart?.quantity}/1 balance.`,
          );
        }

        // Add to update data
        updateData[dbField] = id;

        // Add new part's boosts to total
        newTotalBoosts.starBoost += dbPart.starBoost || 0;
        newTotalBoosts.xpBoost += dbPart.xpBoost || 0;
        newTotalBoosts.raidTimeBoost += dbPart.raidTimeBoost || 0;
        newTotalBoosts.power += dbPart.power || 0;
      }

      // For parts not in the update, keep their current boosts
      Object.entries(currentPartsMap).forEach(([type, part]) => {
        if (part && !parts.some((p) => p.type === type)) {
          newTotalBoosts.starBoost += part.starBoost || 0;
          newTotalBoosts.xpBoost += part.xpBoost || 0;
          newTotalBoosts.raidTimeBoost += part.raidTimeBoost || 0;
          newTotalBoosts.power += part.power || 0;
        }
      });

      // Calculate the differences
      const boostChanges = {
        starBoost: newTotalBoosts.starBoost - currentTotalBoosts.starBoost,
        xpBoost: newTotalBoosts.xpBoost - currentTotalBoosts.xpBoost,
        raidTimeBoost:
          newTotalBoosts.raidTimeBoost - currentTotalBoosts.raidTimeBoost,
        power: newTotalBoosts.power - currentTotalBoosts.power,
      };

      // Perform all database operations in a transaction with increased timeout
      const result = await this.prisma.$transaction(
        async (prisma) => {
          // Update the alien with all the new parts
          const updatedAlien = await prisma.alien.update({
            where: { id: alien.id },
            data: {
              ...updateData,
              equipmentPower: newTotalBoosts.power,
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
              background: true,
            },
          });

          // Update user with boost changes and deduct stars
          await prisma.user.update({
            where: { id: user.id },
            data: {
              stars: {
                decrement: 150,
              },
              // starsBoost: {
              //   increment: boostChanges.starBoost,
              // },
              // xpBoost: {
              //   increment: boostChanges.xpBoost,
              // },
              // raidTimeBoost: {
              //   increment: boostChanges.raidTimeBoost,
              // },
            },
          });

          return updatedAlien;
        },
        {
          timeout: 30000, // Increased timeout to 30 seconds
          maxWait: 35000, // Maximum time to wait for transaction to start
          isolationLevel: 'Serializable', // Highest isolation level for consistency
        },
      );

      return {
        success: true,
        message: `${parts.length} parts equipped successfully`,
        alien: result,
        boostChanges,
      };
    } catch (error) {
      console.error('Error in equipAlienPart:', error);
      return {
        success: false,
        message: error.message || 'Failed to equip parts',
        error: error.toString(),
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
          forgeTime: part.forgeTime,
          userForgeTime: (part.userForgeTime as any[]).find(
            (forge) => forge.userId === user.id,
          )?.timer,
        };
      });

      const elements = await this.prisma.element.findMany({
        where: {
          isForgeable: true,
        },
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
        elements,
        userRuneAmounts: userRuneData,
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async initiateForge(
    walletAddress: string,
    alienPartId?: number,
    elementId?: number,
  ): Promise<{
    success: boolean;
    message?: string;
    error?: any;
    timeLeft?: number;
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

      var alienPart, element;
      if (alienPartId) {
        alienPart = await this.prisma.alienPart.findUnique({
          where: {
            id: alienPartId,
          },
        });

        if (!alienPart) {
          throw new BadRequestException('Alien part not found');
        }
      } else if (elementId) {
        element = await this.prisma.element.findUnique({
          where: {
            id: elementId,
          },
        });

        if (!element) {
          throw new BadRequestException('Element not found');
        }
      } else {
        throw new BadRequestException(
          'Alien part id or Element id must not be empty.',
        );
      }

      if (alienPartId) {
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
      } else if (elementId) {
        const existingElement = await this.prisma.userElement.findFirst({
          where: {
            userId: user.id,
            elementId: elementId,
          },
        });

        if (existingElement) {
          return {
            success: false,
            message: `You already own ${element.name}`,
          };
        }
      }

      var runeType, runeAmount;
      if (alienPartId) {
        runeType = alienPart.forgeRuneType;
        runeAmount = alienPart.forgeRuneAmount;
      } else if (elementId) {
        runeType = element.forgeRuneType;
        runeAmount = element.forgeRuneAmount;
      }

      if (!runeType || !runeAmount) {
        throw new BadRequestException('This item cannot be forged');
      }

      const userRunes = user.runes.filter((rune) => rune === runeType);

      if (userRunes.length < runeAmount) {
        throw new BadRequestException(
          `Insufficient ${runeType} runes. Required: ${runeAmount} ${runeType} runes`,
        );
      }

      // Check if there's an ongoing forge for this user and part
      var userForgeTime;
      if (alienPartId) {
        userForgeTime = ((alienPart as any).userForgeTime || []) as {
          userId: number;
          timer: string;
        }[];
      } else if (elementId) {
        userForgeTime = ((element as any).userForgeTime || []) as {
          userId: number;
          timer: string;
        };
      }

      const existingForge = userForgeTime.find(
        (forge) => forge.userId === user.id,
      );

      if (existingForge) {
        const timeLeft = Math.max(
          0,
          new Date(existingForge.timer).getTime() - new Date().getTime(),
        );

        if (timeLeft > 0) {
          return {
            success: false,
            message: 'Forge already in progress',
            timeLeft: Math.ceil(timeLeft / 1000), // Convert to seconds
          };
        }
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

      // Calculate forge end time
      var forgeEndTime;
      if (alienPartId) {
        forgeEndTime = new Date(
          new Date().getTime() + ((alienPart as any).forgeTime || 300) * 1000,
        );
      } else if (elementId) {
        forgeEndTime = new Date(
          new Date().getTime() + ((element as any).forgeTime || 300) * 1000,
        );
      }

      // Update user runes and add forge timer
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: {
            walletAddress,
          },
          data: {
            runes: newRunes,
          },
        }),
        alienPartId
          ? this.prisma.alienPart.update({
              where: {
                id: alienPartId,
              },
              data: {
                userForgeTime: [
                  ...(userForgeTime.filter(
                    (forge) => forge.userId !== user.id,
                  ) || []),
                  {
                    userId: user.id,
                    timer: forgeEndTime.toISOString(),
                  },
                ] as Prisma.JsonArray,
              },
            })
          : this.prisma.element.update({
              where: {
                id: elementId,
              },
              data: {
                userForgeTime: [
                  ...(userForgeTime.filter(
                    (forge) => forge.userId !== user.id,
                  ) || []),
                  {
                    userId: user.id,
                    timer: forgeEndTime.toISOString(),
                  },
                ] as Prisma.JsonArray,
              },
            }),
      ]);

      return {
        success: true,
        message: `Started forging ${
          alienPartId ? alienPart.name : element.name
        }. Will be ready in ${
          (alienPartId ? alienPart : (element as any)).forgeTime || 300
        } seconds.`,
        timeLeft: (alienPartId ? alienPart : (element as any)).forgeTime || 300,
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  // This method will be called by the cron job
  public async forgeParts(
    walletAddress: string,
    alienPartId?: number,
    elementId?: number,
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

      var alienPart, element;
      if (alienPartId) {
        alienPart = await this.prisma.alienPart.findUnique({
          where: {
            id: alienPartId,
          },
        });

        if (!alienPart) {
          throw new BadRequestException('Alien part not found');
        }
      } else if (elementId) {
        element = await this.prisma.element.findUnique({
          where: {
            id: elementId,
          },
        });

        if (!element) {
          throw new BadRequestException('Element not found');
        }
      } else {
        throw new BadRequestException(
          'Alien part id or element id must not be null',
        );
      }

      // Check if there's a completed forge for this user and part
      const userForgeTime = ((alienPartId ? alienPart : (element as any))
        .userForgeTime || []) as {
        userId: number;
        timer: string;
      }[];

      const existingForge = userForgeTime.find(
        (forge) => forge.userId === user.id,
      );
      if (!existingForge) {
        return {
          success: false,
          message: 'No forge in progress',
        };
      }

      const timeLeft = Math.max(
        0,
        new Date(existingForge.timer).getTime() - new Date().getTime(),
      );
      if (timeLeft > 0) {
        return {
          success: false,
          message: 'Forge still in progress',
        };
      }

      if (alienPartId) {
        // Check if the user already has a part group for this type
        const existingTypeGroup = await this.prisma.alienPartGroup.findFirst({
          where: {
            userId: user.id,
            parts: {
              none: {
                id: alienPartId,
              },
            },
          },
        });

        // Create a new alien part group or update existing one
        if (existingTypeGroup) {
          // Update existing group
          await this.prisma.alienPartGroup.update({
            where: {
              id: existingTypeGroup.id,
            },
            data: {
              parts: {
                connect: {
                  id: alienPartId,
                },
              },
            },
          });

          // Get current availability and update it
          const currentPart = await this.prisma.alienPart.findUnique({
            where: { id: alienPartId },
            select: { availability: true },
          });

          const currentAvailability = (currentPart?.availability || []) as {
            userId: number;
            available: number;
          }[];
          const existingUserAvailability = currentAvailability.find(
            (a) => a.userId === user.id,
          );

          if (existingUserAvailability) {
            // Update existing availability
            await this.prisma.alienPart.update({
              where: { id: alienPartId },
              data: {
                availability: currentAvailability.map((a) =>
                  a.userId === user.id ? { ...a, available: 1.0 } : a,
                ),
              },
            });
          } else {
            // Add new availability entry
            await this.prisma.alienPart.update({
              where: { id: alienPartId },
              data: {
                availability: [
                  ...currentAvailability,
                  { userId: user.id, available: 1.0 },
                ],
              },
            });
          }
        } else {
          // Create new group
          await this.prisma.alienPartGroup.create({
            data: {
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

          // Get current availability and update it
          const currentPart = await this.prisma.alienPart.findUnique({
            where: { id: alienPartId },
            select: { availability: true },
          });

          const currentAvailability = (currentPart?.availability || []) as {
            userId: number;
            available: number;
          }[];
          const existingUserAvailability = currentAvailability.find(
            (a) => a.userId === user.id,
          );

          if (existingUserAvailability) {
            // Update existing availability
            await this.prisma.alienPart.update({
              where: { id: alienPartId },
              data: {
                availability: currentAvailability.map((a) =>
                  a.userId === user.id ? { ...a, available: 1.0 } : a,
                ),
              },
            });
          } else {
            // Add new availability entry
            await this.prisma.alienPart.update({
              where: { id: alienPartId },
              data: {
                availability: [
                  ...currentAvailability,
                  { userId: user.id, available: 1.0 },
                ],
              },
            });
          }
        }

        // Remove the forge timer for this user
        await this.prisma.alienPart.update({
          where: {
            id: alienPartId,
          },
          data: {
            userForgeTime: userForgeTime.filter(
              (forge) => forge.userId !== user.id,
            ) as Prisma.JsonArray,
          },
        });

        return {
          success: true,
          message: `Successfully forged ${alienPart.name} part.`,
        };
      } else if (elementId) {
        await this.prisma.userElement.create({
          data: {
            userId: user.id,
            elementId: elementId,
          },
        });

        // Remove the forge timer for this user
        await this.prisma.element.update({
          where: {
            id: elementId,
          },
          data: {
            userForgeTime: userForgeTime.filter(
              (forge) => forge.userId !== user.id,
            ) as Prisma.JsonArray,
          },
        });

        return {
          success: true,
          message: `Successfully forged ${element.name} element.`,
        };
      }
    } catch (error) {
      return { success: false, error };
    }
  }

  public async forgePartsOld1(
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

      // Check if the user already has a part group for this type
      const existingTypeGroup = await this.prisma.alienPartGroup.findFirst({
        where: {
          userId: user.id,
          parts: {
            none: {
              id: alienPartId,
            },
          },
        },
      });

      // Create a new alien part group or update existing one
      if (existingTypeGroup) {
        // Update existing group
        await this.prisma.alienPartGroup.update({
          where: {
            id: existingTypeGroup.id,
          },
          data: {
            parts: {
              connect: {
                id: alienPartId,
              },
            },
          },
        });
      } else {
        // Create new group
        await this.prisma.alienPartGroup.create({
          data: {
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
      }

      return {
        success: true,
        message: `Successfully forged ${alienPart.name} part.`,
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  public async enhanceParts(
    walletAddress: string,
    alienPartId: number,
  ): Promise<{
    success: boolean;
    message?: string;
    error?: any;
  }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const alienPart = await this.prisma.alienPart.findUnique({
        where: { id: alienPartId },
      });

      if (!alienPart) {
        throw new BadRequestException('Alien part not found');
      }

      // Check if the user owns this part
      const existingPartGroup = await this.prisma.alienPartGroup.findFirst({
        where: {
          userId: user.id,
          parts: {
            some: { id: alienPartId },
          },
        },
      });

      if (!existingPartGroup) {
        return {
          success: false,
          message: `You don't own the ${alienPart.name}`,
        };
      }

      const runeType = alienPart.forgeRuneType;

      if (!runeType) {
        throw new BadRequestException('This alien part cannot be enhanced');
      }

      const REQUIRED_RUNES = 4;
      const userRunes = user.runes.filter((rune) => rune === runeType);

      if (userRunes.length < REQUIRED_RUNES) {
        throw new BadRequestException(
          `Insufficient ${runeType} runes. Required: ${REQUIRED_RUNES} ${runeType} runes`,
        );
      }

      // Get current user powers or initialize if not exists
      const currentPowers = (alienPart.userPowers || []) as {
        userId: number;
        power: number;
      }[];
      const userPowerIndex = currentPowers.findIndex(
        (p) => p.userId === user.id,
      );

      // Calculate new power
      const POWER_INCREASE = 5;
      const newPowers = [...currentPowers];

      if (userPowerIndex === -1) {
        // User doesn't have custom power yet, add new entry
        newPowers.push({
          userId: user.id,
          power: alienPart.power + POWER_INCREASE,
        });
      } else {
        // Update existing power
        newPowers[userPowerIndex] = {
          ...newPowers[userPowerIndex],
          power: newPowers[userPowerIndex].power + POWER_INCREASE,
        };
      }

      // Create a new runes array by removing required runes
      const newRunes = [...user.runes];
      let removedCount = 0;

      for (let i = newRunes.length - 1; i >= 0; i--) {
        if (newRunes[i] === runeType && removedCount < REQUIRED_RUNES) {
          newRunes.splice(i, 1);
          removedCount++;
        }

        if (removedCount === REQUIRED_RUNES) {
          break;
        }
      }

      // Update both user runes and alien part power in a transaction
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { walletAddress },
          data: { runes: newRunes },
        }),
        this.prisma.alienPart.update({
          where: { id: alienPartId },
          data: { userPowers: newPowers },
        }),
      ]);

      return {
        success: true,
        message: `Successfully enhanced ${alienPart.name} part power by ${POWER_INCREASE}.`,
      };
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

import {
  Alien,
  AlienPart,
  Prisma,
  RewardType,
  RuneType,
  User,
} from '@prisma/client';
import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { RaidReward } from './dto/raids.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { levelRequirements } from 'src/configs/global.config';
import { QuestService } from '../quest/quest.service';
import { CharacterService } from '../character/character.service';
import { ProfileService } from '../profile/profile.service';
import { CreateRaidHuntDto } from './dto/create-raid-hunt.dto';

@Injectable()
export class RaidsService {
  constructor(
    private prisma: PrismaService,
    private questService: QuestService,
    private characterService: CharacterService,
    private profileService: ProfileService,
  ) {}

  public async getRaidsList(walletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      include: {
        aliens: true,
      },
    });

    const aliens = await this.prisma.alien.findMany({
      where: {
        id: { in: user.teamAlienIds, notIn: user.raidAlienIds },
      },
      include: {
        element: true,
      },
    });

    const userCharacterRequest = await this.characterService.getUserCharacters(
      walletAddress,
    );
    const userCharacters = userCharacterRequest.success
      ? userCharacterRequest.userCharacters
      : [];

    const teamCharacters = userCharacters.filter(
      (character) => character.onTeam,
    );

    var raids = await this.prisma.raid.findMany({
      include: {
        rewards: true,
        element: true,
      },
    });

    raids = await Promise.all(
      raids.map(async (raid) => {
        const raidReputationPoints = await this.calculateRaidReputation(
          raid.id,
          aliens,
          teamCharacters,
          user,
          raid, // Pass existing raid data to avoid N+1 queries
        );
        const newRaidData = {
          ...raid,
          rewards: [
            ...raid.rewards,
            {
              id: 0,
              type: RewardType.REP,
              amount: raidReputationPoints,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        };
        return newRaidData;
      }),
    );

    return raids;
  }

  public async createRaid(
    title: string,
    description: string,
    duration: number,
    image: string,
    elementId: number,
    rewards: RaidReward[],
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
      const data: Prisma.RaidCreateInput = {
        title,
        description,
        duration,
        image,
        element: {
          connect: {
            id: elementId,
          },
        },
        rewards: {
          create: rewards,
        },
      };
      await this.prisma.raid.create({ data });
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  public async editRaid(
    raidId: number,
    title: string,
    description: string,
    duration: number,
    rewards: RaidReward[],
  ) {
    const data: Prisma.RaidUpdateInput = {
      title,
      description,
      duration,
      rewards: {
        deleteMany: {},
        create: rewards,
      },
    };
    await this.prisma.raid.update({
      where: { id: raidId },
      data,
    });
  }

  public async launchRaid(raidId: number, userWalletAddress: string) {
    try {
      const raid = await this.prisma.raid.findUnique({
        where: { id: raidId },
      });

      if (!raid) {
        throw new BadRequestException('Raid not found');
      }

      const user = await this.prisma.user.findUnique({
        where: { walletAddress: userWalletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Check if user already has an active raid
      const activeRaid = await this.prisma.raidHistory.findFirst({
        where: {
          userId: user.id,
          inProgress: true,
        },
      });

      if (activeRaid) {
        throw new BadRequestException('You already have a raid in progress');
      }

      const aliens = await this.prisma.alien.findMany({
        where: {
          id: { in: user.teamAlienIds, notIn: user.raidAlienIds },
        },
        include: {
          element: true,
        },
      });

      if (aliens.length === 0) {
        throw new BadRequestException(
          'No Aliens found in team or team alien is in a raid',
        );
      }

      const userCharacters = await (
        await this.characterService.getUserCharacters(userWalletAddress)
      ).userCharacters;

      const teamCharacters = userCharacters.filter(
        (character) => character.onTeam,
      );

      for (const character of teamCharacters) {
        if (character.inRaid) {
          throw new BadRequestException('A character is already in raid');
        }
      }

      if (aliens.length + teamCharacters.length > 5) {
        throw new BadRequestException(
          'Too many aliens and characters selected. Maximum is 5',
        );
      }

      if (raid.isHunt) {
        for (const alien of aliens) {
          if (alien.elementId !== raid.elementId) {
            throw new BadRequestException(
              'Alien element does not match Hunt element',
            );
          }
        }
        for (const character of teamCharacters) {
          if (character.element.id !== raid.elementId) {
            throw new BadRequestException(
              'Character element does not match Hunt element',
            );
          }
        }
      }
      console.log('aliens ====>', aliens);
      console.log('characters ====>', teamCharacters);

      const alienIds = aliens.map((alien) => alien.id);
      const characterIds = teamCharacters.map((character) => character.id);

      const raidDuration = await this.calculateRaidDuration(
        raidId,
        aliens,
        teamCharacters,
        user,
        raid, // Pass existing raid to avoid re-fetching from DB
      );

      console.log('raidDuration ===>', raidDuration);

      if (!raidDuration) {
        throw new BadRequestException('Error calculating raid duration');
      }

      const data: Prisma.RaidHistoryCreateInput = {
        inProgress: true,
        raid: {
          connect: { id: raidId },
        },
        user: {
          connect: { id: user.id },
        },
        aliens: {
          connect: alienIds.map((id) => ({ id })),
        },
        characterIds,
        raidFinishTime: new Date(raidDuration * 1000 + Date.now()),
      };

      const raidHistory = await this.prisma.raidHistory.create({ data });

      try {
        await this.questService.progressRaidQuest(userWalletAddress);
      } catch (error) {
        console.error('Error progressing raid quest:', error);
      }

      console.log('raidHistory ====>', raidHistory);
      return {
        success: true,
        raidHistory,
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  public async getRaidHistory(userWalletAddress: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress: userWalletAddress },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      return await this.prisma.raidHistory.findMany({
        where: {
          userId: user.id,
        },
        include: {
          aliens: true,
        },
      });
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  // PERF: Changed from EVERY_10_SECONDS to EVERY_30_SECONDS
  // Raids take minutes/hours so 30s checks are more than sufficient
  // This reduces DB queries by ~3x
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processRaidRewards() {
    try {
      // PERF: Only fetch raids that are actually finished (filter at DB level)
      const raids = await this.prisma.raidHistory.findMany({
        where: {
          inProgress: true,
          raidFinishTime: {
            lte: new Date(), // Only get raids whose finish time has passed
          },
        },
        include: {
          aliens: {
            include: {
              element: true,
            },
          },
          raid: {
            include: {
              rewards: true,
              element: true,
            },
          },
          user: true,
        },
      });

      // Early exit if no completed raids
      if (raids.length === 0) return;

      // PERF: Batch fetch ALL characters needed for all finished raids in one query
      // instead of N+1 (one query per raid)
      const allCharacterIds = raids.flatMap((raid) => raid.characterIds);
      const allCharacters =
        allCharacterIds.length > 0
          ? await this.prisma.character.findMany({
              where: { id: { in: [...new Set(allCharacterIds)] } },
              include: { element: true },
            })
          : [];

      for (const raid of raids) {
        // Filter from pre-fetched batch instead of separate DB query per raid
        const raidCharacters = allCharacters.filter((c) =>
          raid.characterIds.includes(c.id),
        );
        const raidAliens = raid.aliens;
        const raidRewards = raid.raid.rewards;
        const raidUserId = raid.userId;

        console.log('Raid completed:', raid.id);
        await this.prisma.raidHistory.update({
          where: { id: raid.id },
          data: {
            inProgress: false,
          },
        });

        for (const reward of raidRewards) {
            let rewardAmount = reward.amount;
            let rewardType: string;

            console.log(
              `Initial reward: ${reward.type} Amount: ${reward.amount}`,
            );

            if (reward.type === RewardType.XP) {
              rewardType = 'experience';
              if (
                raid.user.lastXpBoost &&
                raid.user.lastXpBoost.getTime() + 24 * 60 * 60 * 1000 >
                  Date.now()
              ) {
                rewardAmount += Math.ceil(reward.amount * (raid.user.xpBoost / 100));
                console.log(
                  `XP boost added from consumable: ${
                    reward.amount * (raid.user.xpBoost / 100)
                  }`,
                );
              }

              // Get raid aliens boosts
              for (const alien of raidAliens) {
                const equippedPartsResponse =
                  await this.profileService.getEquippedAlienParts(
                    raid.user.walletAddress,
                    alien.id,
                  );
                for (const partType in equippedPartsResponse.parts) {
                  const part: AlienPart = equippedPartsResponse.parts[partType];

                  if (!part || !part.xpBoost) continue;
                  rewardAmount += Math.ceil(reward.amount * (part.xpBoost / 100));
                  console.log(
                    `XP boost added from part ${partType}: ${
                      reward.amount * (part.xpBoost / 100)
                    }`,
                  );
                }
              }
            } else if (reward.type === RewardType.STARS) {
              rewardType = 'stars';
              if (
                raid.user.lastStarBoost &&
                raid.user.lastStarBoost.getTime() + 24 * 60 * 60 * 1000 >
                  Date.now()
              ) {
                rewardAmount += Math.ceil(reward.amount * (raid.user.starsBoost / 100));
                console.log(
                  `Stars boost added from consumable: ${
                    reward.amount * (raid.user.starsBoost / 100)
                  }`,
                );
              }

              // Get raid aliens boosts
              for (const alien of raidAliens) {
                const equippedPartsResponse =
                  await this.profileService.getEquippedAlienParts(
                    raid.user.walletAddress,
                    alien.id,
                  );
                for (const partType in equippedPartsResponse.parts) {
                  const part: AlienPart = equippedPartsResponse.parts[partType];

                  if (!part || !part.starBoost) continue;
                  rewardAmount += reward.amount * (part.starBoost / 100);
                  console.log(
                    `Stars boost added from part ${partType}: ${
                      reward.amount * (part.starBoost / 100)
                    }`,
                  );
                }
              }
            }
            await this.prisma.user.update({
              where: { id: raidUserId },
              data: {
                [rewardType]: {
                  increment: rewardAmount,
                },
              },
            });
            console.log(
              `Final reward: ${reward.type} Amount: ${rewardAmount}`,
            );

            var user = await this.prisma.user.findUnique({
              where: { id: raidUserId },
            });

            // Use user.level in levelRequirements because level is 1-based
            if (levelRequirements[user.level]) {
              while (
                user.experience >= levelRequirements[user.level]?.requiredPoints
              ) {
                console.log(`User level up: ${user.level + 1}`);
                user = await this.prisma.user.update({
                  where: { id: raidUserId },
                  data: { level: user.level + 1 },
                });

                try {
                  await this.questService.progressLevelQuest(
                    user.walletAddress,
                  );
                } catch (error) {
                  console.error('Error progressing level quest:', error);
                }

                if (!levelRequirements[user.level]) {
                  console.log('Max level reached');
                  break;
                }
              }
            }
          }

          // Reward Reputation points
          const reputationPoints = await this.calculateRaidReputation(
            raid.raidId,
            raidAliens,
            raidCharacters,
            raid.user,
            raid.raid, // Pass existing raid data to avoid redundant DB fetch
          );
          console.log('Reputation points rewarded:', reputationPoints);

          // Reward runes
          const runeWon = this.getRewardedRune(Math.random());
          console.log('Rune rewarded:', runeWon);

          await this.prisma.user.update({
            where: { id: raidUserId },
            data: {
              reputation: { increment: reputationPoints },
              ...(runeWon && { runes: { push: runeWon } }),
            },
          });
        }
      }
    } catch (error) {
      console.log('Error processing raid rewards:', error);
    }
  }

  public getAllRunesDropRate() {
    return {
      [RuneType.UNCOMMON]: 0.4,
      [RuneType.COMMON]: 0.3,
      [RuneType.RARE]: 0.18,
      [RuneType.EPIC]: 0.08,
      [RuneType.LEGENDARY]: 0.04,
    };
  }

  public getRewardedRune(roll: number): RuneType | null {
    const runesDropRate = this.getAllRunesDropRate();
    let cumulativeRate = 0;

    for (const runeType in runesDropRate) {
      cumulativeRate += runesDropRate[runeType];
      if (roll < cumulativeRate) {
        return runeType as RuneType;
      }
    }

    return null;
  }

  // PERF: Accept optional raid object to avoid re-fetching from DB
  private async calculateRaidDuration(
    raidId: number,
    raidAliens: any[],
    raidCharacters: any[],
    user: User,
    existingRaid?: { elementId: number; duration: number } | null,
  ) {
    try {
      const raid = existingRaid ?? await this.prisma.raid.findUnique({
        where: { id: raidId },
      });

      if (!raid) {
        throw new BadRequestException('Raid not found');
      }

      const raidElementId = raid.elementId;
      const raidDuration = raid.duration;

      // Calculate new raid duration after all effects
      let newRaidDuration = raidDuration;
      for (const alien of raidAliens) {
        const alienElement = alien.element;

        if (alienElement.weaknessId === raidElementId) {
          // console.log(`Weakness found.`);
          newRaidDuration += raidDuration * 0.02;
        } else if (alienElement.strengthId === raidElementId) {
          // console.log(`Strength found.`);
          newRaidDuration -= raidDuration * 0.02;
        }
      }
      for (const character of raidCharacters) {
        const characterElement = character.element;

        if (characterElement.weaknessId === raidElementId) {
          // console.log(`Weakness found.`);
          newRaidDuration += raidDuration * 0.02;
        } else if (characterElement.strengthId === raidElementId) {
          // console.log(`Strength found.`);
          newRaidDuration -= raidDuration * 0.02;
        }
      }

      // console.log(`Raid duration after alien/character weakness/strength: ${newRaidDuration}`);

      if (
        user.lastRaidBoost &&
        user.lastRaidBoost.getTime() + 24 * 60 * 60 * 1000 > Date.now()
      ) {
        // console.log(`Raid boost found.`);
        newRaidDuration -= raidDuration * (user.raidTimeBoost / 100);
      }

      // console.log(`Raid duration after user boost: ${newRaidDuration}`);

      // Calculate raid duration based on equipped parts on each alien in raid
      for (const alien of raidAliens) {
        const equippedPartsResponse =
          await this.profileService.getEquippedAlienParts(
            user.walletAddress,
            alien.id,
          );

        for (const partType in equippedPartsResponse.parts) {
          const part: AlienPart = equippedPartsResponse.parts[partType];

          if (!part || !part.raidTimeBoost) continue;
          // console.log(`Part boost found for part: ${partType}`);
          newRaidDuration -= raidDuration * (part.raidTimeBoost / 100);
        }
      }
      // console.log(`Raid duration after alien part boosts: ${newRaidDuration}`);

      return newRaidDuration;
    } catch (error) {
      console.log('Error calculating raid duration:', error);
      return null;
    }
  }

  // PERF: Accept optional raid object to avoid redundant DB fetch
  private async calculateRaidReputation(
    raidId: number,
    raidAliens: Alien[],
    raidCharacters: any[],
    raidUser: User,
    existingRaid?: { elementId: number; duration: number } | null,
  ): Promise<number> {
    const raid = existingRaid ?? await this.prisma.raid.findUnique({
      where: { id: raidId },
    });

    if (!raid) {
      throw new BadRequestException('Raid not found');
    }

    const raidDuration = await this.calculateRaidDuration(
      raidId,
      raidAliens,
      raidCharacters,
      raidUser,
      raid, // Pass the already-fetched raid to avoid another DB query
    );

    const teamStrength =
      raidAliens.reduce((acc, alien) => acc + alien.strengthPoints, 0) +
      raidCharacters.reduce((acc, character) => acc + character.power, 0);
    // Calculate minutes: round to nearest minute but minimum 1 minute
    const minutes = Math.max(Math.round(raidDuration / 60), 1);

    console.log('raidId ===>', {
      raidId: raidId,
      duration: raidDuration,
      minutes: minutes,
      strenght: teamStrength,
    });

    const reputationPoints = Math.round(minutes * teamStrength);

    return reputationPoints;
  }

  public async createRaidOrHunt(createRaidHuntDto: CreateRaidHuntDto) {
    try {
      const {
        title,
        description,
        duration,
        image,
        elementId,
        rewards,
        isHunt,
      } = createRaidHuntDto;

      const element = await this.prisma.element.findUnique({
        where: {
          id: elementId,
        },
      });

      if (!element) {
        throw new BadRequestException('Element not found');
      }

      const data: Prisma.RaidCreateInput = {
        title,
        description,
        duration,
        image,
        isHunt,
        element: {
          connect: {
            id: elementId,
          },
        },
        rewards: {
          create: rewards,
        },
      };

      const raid = await this.prisma.raid.create({
        data,
        include: {
          rewards: true,
          element: true,
        },
      });

      return {
        success: true,
        raid,
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }
}

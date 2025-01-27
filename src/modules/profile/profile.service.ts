import { DailyRewardType, Prisma, User } from '@prisma/client';
import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { WALLETADDRESS_ALREADY_EXISTS } from 'src/shared/constants/strings';
import exp from 'constants';
import { CreateAlienDTO } from './dto/profile.dto';
import { ListObjectsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  private s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  });



  public async getProfile(walletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress: walletAddress.toLowerCase(),
      },
    });

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
    };
  }

  public async createAlien(
    walletAddress: string,
    createAlienDTO: CreateAlienDTO,
    image: Express.Multer.File,
  ) {
    const alien = await this.prisma.alien.create({
      data: {
        name: createAlienDTO.name,
        element: createAlienDTO.element,
        strengthPoints: Number(createAlienDTO.strengthPoints),
        inRaid: false,
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
    }
    catch (error) {
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

        const images = response.Contents.map((content) => `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${content.Key}`);
        allImages[folder] = images;
      }
    }
    catch (error) {
      console.error(`Error listing objects in S3: ${error}`);
    }

    return allImages;
  }

  public async useReferralCode(walletAddress: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const referrer = await this.prisma.user.findUnique({
      where: {
        referralCode: code,
      },
    });

    if (!referrer) {
      throw new BadRequestException('Referral code not found');
    }

    if (user.referrerId) {
      throw new BadRequestException('Referral code already used');
    }

    await this.prisma.user.update({
      where: {
        walletAddress,
      },
      data: {
        referrerId: referrer.id,
      },
    });

    await this.prisma.user.update({
      where: {
        id: referrer.id,
      },
      data: {
        stars: {
          increment: 50,
        },
      },
    });
  }

}

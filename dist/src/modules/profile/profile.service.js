"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_s3_1 = require("@aws-sdk/client-s3");
let ProfileService = class ProfileService {
    constructor(prisma) {
        this.prisma = prisma;
        this.s3 = new client_s3_1.S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
        });
    }
    async getProfile(walletAddress) {
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
    async createAlien(walletAddress, createAlienDTO, image) {
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
        try {
            const uploadParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `aliens/${alien.id}_${createAlienDTO.name}.png`,
                Body: image.buffer,
                ContentType: 'image/png',
            };
            const uploadCommand = new client_s3_1.PutObjectCommand(uploadParams);
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
    async getAliens(walletAddress) {
        const aliens = await this.prisma.alien.findMany({
            where: {
                user: {
                    walletAddress: walletAddress,
                },
            },
        });
        return aliens;
    }
    async getCharacters(walletAddress) {
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
    async getItems(walletAddress) {
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
    async getLeaderboard() {
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
    async awardDailyRewards(walletAddress) {
        const user = await this.prisma.user.findUnique({
            where: {
                walletAddress,
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
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
            throw new common_1.BadRequestException('No daily rewards available yet.');
        }
        else if (timeSinceLastClaim >= hours24 && timeSinceLastClaim < hours48) {
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
        }
        else {
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
        if (reward.type === client_1.DailyRewardType.ITEM) {
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
        }
        else {
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
    async updateStarBalance(walletAddress, amount) {
        const user = await this.prisma.user.findUnique({
            where: {
                walletAddress,
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
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
    async getAllTraits() {
        const traitFolders = ['Body', 'Elements', 'Eyes', 'Face', 'Hair', 'Mouth'];
        const allImages = {};
        try {
            for (const folder of traitFolders) {
                const input = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Prefix: `traits/${folder}/`,
                    MaxKeys: 1000,
                };
                const command = new client_s3_1.ListObjectsCommand(input);
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
    async useReferralCode(walletAddress, code) {
        const user = await this.prisma.user.findUnique({
            where: {
                walletAddress,
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const referrer = await this.prisma.user.findUnique({
            where: {
                referralCode: code,
            },
        });
        if (!referrer) {
            throw new common_1.BadRequestException('Referral code not found');
        }
        if (user.referrerId) {
            throw new common_1.BadRequestException('Referral code already used');
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
};
ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProfileService);
exports.ProfileService = ProfileService;
//# sourceMappingURL=profile.service.js.map
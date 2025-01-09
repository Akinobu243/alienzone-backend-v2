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
exports.RaidsService = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const schedule_1 = require("@nestjs/schedule");
const global_config_1 = require("../../configs/global.config");
let RaidsService = class RaidsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getRaidsList() {
        return await this.prisma.raid.findMany({
            include: {
                rewards: true,
            },
        });
    }
    async createRaid(title, description, duration, icon, image, rewards) {
        const data = {
            title,
            description,
            duration,
            icon,
            image,
            rewards: {
                create: rewards,
            },
        };
        await this.prisma.raid.create({ data });
    }
    async editRaid(raidId, title, description, duration, rewards) {
        const data = {
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
    async launchRaid(raidId, alienIds, characterIds, userWalletAddress) {
        const raid = await this.prisma.raid.findUnique({
            where: { id: raidId },
        });
        if (!raid) {
            throw new common_1.BadRequestException('Raid not found');
        }
        const user = await this.prisma.user.findUnique({
            where: { walletAddress: userWalletAddress },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const aliens = await this.prisma.alien.findMany({
            where: {
                id: { in: alienIds },
                userId: user.id,
            },
        });
        if (aliens.length !== alienIds.length) {
            throw new common_1.BadRequestException('Aliens not found');
        }
        for (const alien of aliens) {
            if (alien.inRaid) {
                throw new common_1.BadRequestException('An alien is already in raid');
            }
        }
        const data = {
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
        };
        const raidHistory = await this.prisma.raidHistory.create({ data });
        return raidHistory;
    }
    async getRaidHistory(userWalletAddress) {
        const user = await this.prisma.user.findUnique({
            where: { walletAddress: userWalletAddress },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        return await this.prisma.raidHistory.findMany({
            where: {
                userId: user.id,
            },
            include: {
                aliens: true,
            },
        });
    }
    async processRaidRewards() {
        const raids = await this.prisma.raidHistory.findMany({
            where: {
                inProgress: true,
            },
            include: {
                aliens: true,
                raid: {
                    include: {
                        rewards: true,
                    },
                },
            },
        });
        console.log('Raids found:', raids.length);
        for (const raid of raids) {
            const raidAliens = raid.aliens;
            const raidRewards = raid.raid.rewards;
            const raidUserId = raid.userId;
            if (raid.createdAt.getTime() + raid.raid.duration * 1000 < Date.now()) {
                console.log('Raid completed:', raid.id);
                await this.prisma.raidHistory.update({
                    where: { id: raid.id },
                    data: {
                        inProgress: false,
                    },
                });
                for (const reward of raidRewards) {
                    let rewardType = 'experience';
                    if (reward.type === client_1.RewardType.REP) {
                        rewardType = 'reputation';
                    }
                    else if (reward.type === client_1.RewardType.STARS) {
                        rewardType = 'stars';
                    }
                    await this.prisma.user.update({
                        where: { id: raidUserId },
                        data: {
                            [rewardType]: {
                                increment: reward.amount,
                            },
                        },
                    });
                    console.log('Reward processed:', reward.type, reward.amount);
                    const user = await this.prisma.user.findUnique({
                        where: { id: raidUserId },
                    });
                    const userLevel = user.level;
                    const levelRequirement = global_config_1.levelRequirements[userLevel];
                    if (user.experience >= levelRequirement.requiredPoints) {
                        console.log('User level up:', userLevel + 1);
                        await this.prisma.user.update({
                            where: { id: raidUserId },
                            data: { level: userLevel + 1 },
                        });
                    }
                }
            }
        }
    }
};
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RaidsService.prototype, "processRaidRewards", null);
RaidsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RaidsService);
exports.RaidsService = RaidsService;
//# sourceMappingURL=raids.service.js.map
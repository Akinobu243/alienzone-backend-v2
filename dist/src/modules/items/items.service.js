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
exports.ItemsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ItemsService = class ItemsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createItem(name, description, image) {
        await this.prisma.item.create({
            data: {
                name,
                description,
                image,
            },
        });
    }
    async editItem(id, name, description, image) {
        await this.prisma.item.update({
            where: {
                id: id,
            },
            data: Object.assign(Object.assign(Object.assign({}, (name && { name })), (description && { description })), (image && { image })),
        });
    }
    async deleteItem(id) {
        await this.prisma.item.delete({
            where: {
                id: id,
            },
        });
    }
    async getAllItems(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        return await this.prisma.item.findMany({
            skip: skip,
            take: limit,
        });
    }
    async setDailyRewards(rewards) {
        for (const reward of rewards) {
            await this.prisma.dailyReward.upsert({
                where: {
                    id: reward.day,
                },
                update: {
                    type: reward.type,
                    itemId: reward.type === client_1.DailyRewardType.ITEM ? reward.itemId : null,
                    amount: reward.amount,
                },
                create: {
                    type: reward.type,
                    item: {
                        connect: { id: reward.itemId },
                    },
                    amount: reward.amount,
                },
            });
        }
    }
    async rewardItem(walletAddress, itemId) {
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
                id: userItem === null || userItem === void 0 ? void 0 : userItem.id,
            },
            update: {
                quantity: (userItem === null || userItem === void 0 ? void 0 : userItem.quantity) + 1,
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
};
ItemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ItemsService);
exports.ItemsService = ItemsService;
//# sourceMappingURL=items.service.js.map
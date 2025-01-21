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
exports.UserService = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const strings_1 = require("../../shared/constants/strings");
let UserService = class UserService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkExists(walletAddress) {
        const user = await this.findUser({
            walletAddress: walletAddress.toLowerCase(),
        });
        return user ? true : false;
    }
    async findUser(userWhereUniqueInput) {
        try {
            return await this.prisma.user.findUnique({
                where: userWhereUniqueInput,
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                return null;
            }
            throw error;
        }
    }
    async users(params) {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.user.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
        });
    }
    async countUsers(where) {
        return this.prisma.user.count({ where });
    }
    async createUser(data) {
        const { walletAddress } = data;
        const userExists = await this.findUser({ walletAddress });
        if (userExists) {
            throw new common_1.BadRequestException({
                success: false,
                message: strings_1.WALLETADDRESS_ALREADY_EXISTS,
            });
        }
        return this.prisma.user.create({
            data,
        });
    }
    async updateUser(params) {
        const { where, data } = params;
        return this.prisma.user.update({
            data,
            where,
        });
    }
    async deleteUser(where) {
        return this.prisma.user.delete({
            where,
        });
    }
};
UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map
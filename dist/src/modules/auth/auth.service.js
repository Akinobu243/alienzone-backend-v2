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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const user_service_1 = require("../user/user.service");
const prisma_service_1 = require("../prisma/prisma.service");
const global_config_1 = require("../../configs/global.config");
const strings_1 = require("../../shared/constants/strings");
const auth_constants_1 = require("./auth.constants");
const ethers_1 = require("ethers");
let AuthService = class AuthService {
    constructor(userService, prisma, jwtService) {
        this.userService = userService;
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async authenticate(authUser, admin, registerUser) {
        if (authUser.accessToken && authUser.accessToken.length > 0) {
            const payload = this.jwtService.verify(authUser.accessToken);
            const user = await this.userService.findUser({
                walletAddress: payload.walletAddress,
            });
            if (!user) {
                throw new common_1.UnauthorizedException({
                    success: false,
                    message: strings_1.INVALID_ACCESS_TOKEN,
                });
            }
            if (admin && user.role !== auth_constants_1.ADMIN_ROLE) {
                throw new common_1.UnauthorizedException({
                    success: false,
                    message: strings_1.UNAUTHORIZED,
                });
            }
            return {
                walletAddress: user.walletAddress,
                accessToken: authUser.accessToken,
            };
        }
        if (!authUser.signedMessage || !authUser.signature) {
            throw new common_1.BadRequestException({
                success: false,
                message: strings_1.MISSING_SIGNED_MESSAGE_OR_SIGNATURE,
            });
        }
        const userWalletAddress = ethers_1.ethers
            .verifyMessage(authUser.signedMessage, authUser.signature)
            .toLowerCase();
        if (!this.isValidWalletAddress(userWalletAddress)) {
            throw new common_1.BadRequestException({
                success: false,
                message: strings_1.INVALID_WALLET_ADDRESS,
            });
        }
        var user = await this.userService.findUser({
            walletAddress: userWalletAddress,
        });
        if (!user) {
            var referralCode = Math.random().toString(36).substring(2, 8);
            var existingUser = await this.userService.findUser({
                referralCode: referralCode,
            });
            while (existingUser) {
                referralCode = Math.random().toString(36).substring(2, 8);
                existingUser = await this.userService.findUser({
                    referralCode: referralCode,
                });
            }
            user = await this.userService.createUser({
                walletAddress: userWalletAddress,
                name: registerUser.name,
                country: registerUser.country,
                twitterId: registerUser.twitterId || '',
                enterprise: registerUser.enterprise || '',
                referralCode: referralCode,
                referrerId: null,
                image: registerUser.image || '',
                level: 1,
                experience: 0,
                reputation: 0,
                stars: 0,
                role: auth_constants_1.USER_ROLE,
            });
        }
        if (admin && user.role !== auth_constants_1.ADMIN_ROLE) {
            throw new common_1.UnauthorizedException({
                success: false,
                message: strings_1.UNAUTHORIZED,
            });
        }
        const payload = user;
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: global_config_1.GLOBAL_CONFIG.security.expiresIn,
        });
        return {
            walletAddress: user.walletAddress,
            accessToken: accessToken,
        };
    }
    async authenticateTma(walletAddress) {
        var user = await this.userService.findUser({
            walletAddress: walletAddress.toLowerCase(),
        });
        if (!user) {
            user = await this.userService.createUser({
                walletAddress: walletAddress.toLowerCase(),
                name: '',
                country: '',
                twitterId: '',
                enterprise: '',
                referralCode: '',
                image: '',
                level: 1,
                experience: 0,
                reputation: 0,
                stars: 0,
                role: auth_constants_1.USER_ROLE,
            });
        }
        const payload = user;
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: global_config_1.GLOBAL_CONFIG.security.expiresIn,
        });
        return {
            walletAddress: user.walletAddress,
            accessToken: accessToken,
        };
    }
    isValidWalletAddress(walletAddress) {
        return (ethers_1.ethers.isAddress(walletAddress) &&
            walletAddress.length === 42 &&
            walletAddress.startsWith('0x'));
    }
};
AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map
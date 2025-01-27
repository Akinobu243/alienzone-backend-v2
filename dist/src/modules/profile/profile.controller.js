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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const profile_service_1 = require("./profile.service");
const auth_guard_1 = require("../auth/guards/auth.guard");
const profile_dto_1 = require("./dto/profile.dto");
const platform_express_1 = require("@nestjs/platform-express");
let ProfileController = class ProfileController {
    constructor(profileService) {
        this.profileService = profileService;
    }
    async getProfile(walletAddress) {
        return this.profileService.getProfile(walletAddress);
    }
    async createAlien(createAlienDTO, image, req) {
        return this.profileService.createAlien(req.walletAddress.toLowerCase(), createAlienDTO, image);
    }
    async getAliens(req) {
        return this.profileService.getAliens(req.walletAddress.toLowerCase());
    }
    async getCharacters(req) {
        return this.profileService.getCharacters(req.walletAddress.toLowerCase());
    }
    async getItems(req) {
        return this.profileService.getItems(req.walletAddress.toLowerCase());
    }
    async getLeaderboard() {
        return this.profileService.getLeaderboard();
    }
    async awardDailyRewards(req) {
        return this.profileService.awardDailyRewards(req.walletAddress);
    }
    async updateStarBalance(password, walletAddress, amount) {
        if (password !== process.env.V1_SYNC_PASSWORD) {
            throw new common_1.UnauthorizedException('Invalid password');
        }
        amount = parseInt(amount.toString());
        return this.profileService.updateStarBalance(walletAddress, amount);
    }
    async getAllTraits() {
        return this.profileService.getAllTraits();
    }
    async useReferralCode(req, code) {
        return this.profileService.useReferralCode(req.walletAddress, code);
    }
};
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('/get-profile'),
    (0, swagger_1.ApiQuery)({ name: 'walletAddress', type: String }),
    __param(0, (0, common_1.Query)('walletAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Post)('/create-alien'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [profile_dto_1.CreateAlienDTO, Object, Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "createAlien", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('/get-aliens'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "getAliens", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('/get-characters'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "getCharacters", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('/get-items'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "getItems", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('/get-leaderboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Post)('/award-daily-rewards'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "awardDailyRewards", null);
__decorate([
    (0, common_1.Post)('/update-star-balance-from-v1'),
    __param(0, (0, common_1.Body)('password')),
    __param(1, (0, common_1.Body)('walletAddress')),
    __param(2, (0, common_1.Body)('amount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "updateStarBalance", null);
__decorate([
    (0, common_1.Get)('/get-all-traits'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "getAllTraits", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Post)('/use-referral-code'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "useReferralCode", null);
ProfileController = __decorate([
    (0, swagger_1.ApiTags)('profile'),
    (0, common_1.Controller)('/profile'),
    __metadata("design:paramtypes", [profile_service_1.ProfileService])
], ProfileController);
exports.ProfileController = ProfileController;
//# sourceMappingURL=profile.controller.js.map
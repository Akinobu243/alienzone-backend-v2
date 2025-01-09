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
exports.RaidsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const raids_service_1 = require("./raids.service");
const auth_guard_1 = require("../auth/guards/auth.guard");
const admin_guard_1 = require("../auth/guards/admin.guard");
const raids_dto_1 = require("./dto/raids.dto");
let RaidsController = class RaidsController {
    constructor(raidsService) {
        this.raidsService = raidsService;
    }
    async getRaidsList() {
        return this.raidsService.getRaidsList();
    }
    async createRaid(createRaidDTO, req) {
        return this.raidsService.createRaid(createRaidDTO.title, createRaidDTO.description, createRaidDTO.duration, createRaidDTO.icon, createRaidDTO.image, createRaidDTO.rewards);
    }
    async editRaid(editRaidDto, req) {
        return this.raidsService.editRaid(editRaidDto.raidId, editRaidDto.title, editRaidDto.description, editRaidDto.duration, editRaidDto.rewards);
    }
    async launchRaid(launchRaidDTO, req) {
        return this.raidsService.launchRaid(launchRaidDTO.raidId, launchRaidDTO.alienIds, launchRaidDTO.characterIds, req.walletAddress);
    }
    async getRaidHistory(req) {
        return this.raidsService.getRaidHistory(req.walletAddress);
    }
};
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('/get-list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RaidsController.prototype, "getRaidsList", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Post)('/create-raid'),
    (0, swagger_1.ApiBody)({ type: raids_dto_1.CreateRaidDTO }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [raids_dto_1.CreateRaidDTO, Object]),
    __metadata("design:returntype", Promise)
], RaidsController.prototype, "createRaid", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Post)('/edit-raid'),
    (0, swagger_1.ApiBody)({ type: raids_dto_1.EditRaidDTO }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [raids_dto_1.EditRaidDTO, Object]),
    __metadata("design:returntype", Promise)
], RaidsController.prototype, "editRaid", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Post)('/launch-raid'),
    (0, swagger_1.ApiBody)({ type: raids_dto_1.LaunchRaidDTO }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [raids_dto_1.LaunchRaidDTO, Object]),
    __metadata("design:returntype", Promise)
], RaidsController.prototype, "launchRaid", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('/get-raid-history'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RaidsController.prototype, "getRaidHistory", null);
RaidsController = __decorate([
    (0, swagger_1.ApiTags)('raids'),
    (0, common_1.Controller)('/raids'),
    __metadata("design:paramtypes", [raids_service_1.RaidsService])
], RaidsController);
exports.RaidsController = RaidsController;
//# sourceMappingURL=raids.controller.js.map
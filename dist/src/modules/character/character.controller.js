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
exports.CharacterController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_guard_1 = require("../auth/guards/admin.guard");
const character_service_1 = require("./character.service");
const auth_guard_1 = require("../auth/guards/auth.guard");
let CharacterController = class CharacterController {
    constructor(characterService) {
        this.characterService = characterService;
    }
    async createCharacter(name, level, element, strengthPoints, image) {
        strengthPoints = parseInt(strengthPoints.toString());
        return this.characterService.createCharacter(name, level, element, strengthPoints, image);
    }
    async editCharacter(id, name, level, element, strengthPoints, image) {
        id = parseInt(id.toString());
        if (strengthPoints !== undefined) {
            strengthPoints = parseInt(strengthPoints.toString());
        }
        return this.characterService.editCharacter(id, name, level, element, strengthPoints, image);
    }
    async deleteCharacter(id) {
        id = parseInt(id.toString());
        return this.characterService.deleteCharacter(id);
    }
    async getAllCharacters() {
        return this.characterService.getAllCharacters();
    }
    async rewardCharacter(req) {
        return this.characterService.rewardCharacter(req.walletAddress.toLowerCase());
    }
    async getUserCharacters(req) {
        return this.characterService.getUserCharacters(req.walletAddress.toLowerCase());
    }
};
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Post)('/create-character'),
    __param(0, (0, common_1.Body)('name')),
    __param(1, (0, common_1.Body)('level')),
    __param(2, (0, common_1.Body)('element')),
    __param(3, (0, common_1.Body)('strengthPoints')),
    __param(4, (0, common_1.Body)('image')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, Number, String]),
    __metadata("design:returntype", Promise)
], CharacterController.prototype, "createCharacter", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Post)('/edit-character'),
    __param(0, (0, common_1.Body)('id')),
    __param(1, (0, common_1.Body)('name')),
    __param(2, (0, common_1.Body)('level')),
    __param(3, (0, common_1.Body)('element')),
    __param(4, (0, common_1.Body)('strengthPoints')),
    __param(5, (0, common_1.Body)('image')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Number, String, Number, String]),
    __metadata("design:returntype", Promise)
], CharacterController.prototype, "editCharacter", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Post)('/delete-character'),
    __param(0, (0, common_1.Body)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CharacterController.prototype, "deleteCharacter", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Get)('/get-all-characters'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CharacterController.prototype, "getAllCharacters", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Post)('/reward-character'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CharacterController.prototype, "rewardCharacter", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('/get-user-characters'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CharacterController.prototype, "getUserCharacters", null);
CharacterController = __decorate([
    (0, swagger_1.ApiTags)('character'),
    (0, common_1.Controller)('/character'),
    __metadata("design:paramtypes", [character_service_1.CharacterService])
], CharacterController);
exports.CharacterController = CharacterController;
//# sourceMappingURL=character.controller.js.map
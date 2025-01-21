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
exports.CharacterService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CharacterService = class CharacterService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCharacter(name, level, element, strengthPoints, image) {
        await this.prisma.character.create({
            data: {
                name,
                level,
                element,
                strengthPoints,
                image,
            },
        });
    }
    async editCharacter(id, name, level, element, strengthPoints, image) {
        await this.prisma.character.update({
            where: {
                id: id,
            },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (name && { name })), (level && { level })), (element && { element })), (strengthPoints && { strengthPoints })), (image && { image })),
        });
    }
    async deleteCharacter(id) {
        await this.prisma.character.delete({
            where: {
                id: id,
            },
        });
    }
    async getAllCharacters() {
        return await this.prisma.character.findMany();
    }
    async rewardCharacter(walletAddress) {
        const characters = await this.prisma.character.findMany();
        const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
        const user = await this.prisma.user.findUnique({
            where: {
                walletAddress,
            },
        });
        await this.prisma.userCharacter.create({
            data: {
                user: {
                    connect: {
                        id: user.id,
                    },
                },
                character: {
                    connect: {
                        id: randomCharacter.id,
                    },
                },
            },
        });
    }
    async getUserCharacters(walletAddress) {
        const user = await this.prisma.user.findUnique({
            where: {
                walletAddress,
            },
            include: {
                characters: true,
            },
        });
        var userCharacters = user.characters.map(async (char) => {
            return await this.prisma.character.findUnique({
                where: {
                    id: char.characterId,
                },
            });
        });
        return userCharacters;
    }
};
CharacterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CharacterService);
exports.CharacterService = CharacterService;
//# sourceMappingURL=character.service.js.map
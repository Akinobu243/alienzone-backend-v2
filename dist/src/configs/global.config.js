"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.levelRequirements = exports.GLOBAL_CONFIG = void 0;
const global_constants_1 = require("../shared/constants/global.constants");
exports.GLOBAL_CONFIG = {
    nest: {
        port: 3000,
    },
    cors: {
        enabled: true,
    },
    swagger: {
        enabled: true,
        title: 'Nestjs Prisma Starter',
        description: 'The nestjs API description',
        version: '1.0.0',
        path: global_constants_1.API_PREFIX,
    },
    security: {
        expiresIn: 3600 * 24,
        bcryptSaltOrRound: 10,
    },
};
exports.levelRequirements = [
    {
        level: 1,
        requiredPoints: 0,
    },
    {
        level: 2,
        requiredPoints: 250,
    },
    {
        level: 3,
        requiredPoints: 500,
    },
    {
        level: 4,
        requiredPoints: 1000,
    },
    {
        level: 5,
        requiredPoints: 2000,
    },
    {
        level: 6,
        requiredPoints: 5000,
    },
    {
        level: 7,
        requiredPoints: 10000,
    },
    {
        level: 8,
        requiredPoints: 20000,
    },
    {
        level: 9,
        requiredPoints: 40000,
    },
    {
        level: 10,
        requiredPoints: 80000,
    },
];
//# sourceMappingURL=global.config.js.map
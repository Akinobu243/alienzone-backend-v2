import { API_PREFIX } from '../shared/constants/global.constants';

import { Config } from './config.interface';

export const GLOBAL_CONFIG: Config = {
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
    path: API_PREFIX,
  },
  security: {
    expiresIn: 3600 * 24, // 24h
    bcryptSaltOrRound: 10,
  },
};

export const levelRequirements = [
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

export const singleCharacterSummonCost = 1;
export const multiCharacterSummonCost = 5;

import { PrismaClientOptions } from '@prisma/client/runtime';
export type LogLevel = 'info' | 'error';
export type LogDefinition = {
    level: LogLevel;
    emit: 'stdout' | 'event';
};
export declare const PRISMA_LOG_CONFIG: Array<LogDefinition>;
export declare const PRISMA_CLIENT_OPTIONS: PrismaClientOptions;

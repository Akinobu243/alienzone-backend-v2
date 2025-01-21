import { LoggerOptions } from 'winston';
import { LoggerService } from '@nestjs/common';
export declare class MyLogger implements LoggerService {
    private readonly logger;
    private level;
    private context;
    private static LOGS_PATH;
    constructor();
    getLoggerOptions(level: string): LoggerOptions;
    setContext(context: string): this;
    setLevel(level: string): this;
    log(message: string): void;
    error(message: string, trace?: string): void;
    warn(message: string): void;
    info(message: string): void;
    debug(message: string): void;
    overrideOptions(options: LoggerOptions): void;
    private logToConsole;
}

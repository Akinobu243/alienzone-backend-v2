import { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
export declare class ProducerService implements OnModuleInit, OnApplicationShutdown {
    private readonly kafka;
    private readonly producer;
    onModuleInit(): Promise<void>;
    produce(record: any): Promise<void>;
    onApplicationShutdown(signal?: string): Promise<void>;
}

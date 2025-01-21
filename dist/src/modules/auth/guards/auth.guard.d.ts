import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare class AuthGuard implements CanActivate {
    private reflector;
    private jwtAuthGuard;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractTokenFromRequest;
}

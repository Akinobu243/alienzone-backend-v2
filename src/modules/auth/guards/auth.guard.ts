import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../auth.jwt.guard';
import { ADMIN_ROLE, USER_ROLE } from '../auth.constants';
import { PrismaService } from '../../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  private jwtAuthGuard: JwtAuthGuard;

  constructor(private reflector: Reflector, private prisma: PrismaService) {
    this.jwtAuthGuard = new JwtAuthGuard(reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      return false;
    }
    const decoded = jwt.decode(token) as jwt.JwtPayload;

    if (
      !decoded ||
      ((decoded.role as string) !== USER_ROLE &&
        (decoded.role as string) !== ADMIN_ROLE)
    ) {
      return false;
    }

    // Check if user is banned
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: (decoded.walletAddress as string).toLowerCase() },
    });

    if (!user || user.isBanned) {
      return false;
    }

    request.walletAddress = (decoded.walletAddress as string).toLowerCase();
    return true;
  }

  private extractTokenFromRequest(request: any): string {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return null;
    }

    const [bearer, token] = authorization.split(' ');

    if (bearer !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}

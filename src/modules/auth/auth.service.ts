import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthHelpers } from '../../shared/helpers/auth.helpers';
import { GLOBAL_CONFIG } from '../../configs/global.config';

import { AuthResponseDTO, AuthUserDTO, RegisterUserDTO } from './dto/auth.dto';
import { INVALID_ACCESS_TOKEN, INVALID_WALLET_ADDRESS, MISSING_SIGNED_MESSAGE_OR_SIGNATURE, UNAUTHORIZED } from 'src/shared/constants/strings';
import { ADMIN_ROLE, USER_ROLE } from './auth.constants';
import { ethers } from 'ethers';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  public async authenticate(
    authUser: AuthUserDTO,
    admin?: boolean,
    registerUser?: RegisterUserDTO,
  ): Promise<AuthResponseDTO> {
    if (authUser.accessToken && authUser.accessToken.length > 0) {
      const payload = this.jwtService.verify(authUser.accessToken);
      const user = await this.userService.findUser({
        walletAddress: payload.walletAddress,
      });
      if (!user) {
        throw new UnauthorizedException({
          success: false,
          message: INVALID_ACCESS_TOKEN,
        });
      }
      if (admin && user.role !== (ADMIN_ROLE as any)) {
        throw new UnauthorizedException({
          success: false,
          message: UNAUTHORIZED,
        });
      }

      return {
        walletAddress: user.walletAddress,
        accessToken: authUser.accessToken,
      };
    }

    if (!authUser.signedMessage || !authUser.signature) {
      throw new BadRequestException({
        success: false,
        message: MISSING_SIGNED_MESSAGE_OR_SIGNATURE,
      });
    }

    const userWalletAddress = ethers
      .verifyMessage(authUser.signedMessage, authUser.signature)
      .toLowerCase();

    if (!this.isValidWalletAddress(userWalletAddress)) {
      throw new BadRequestException({
        success: false,
        message: INVALID_WALLET_ADDRESS,
      });
    }

    var user = await this.userService.findUser({
      walletAddress: userWalletAddress,
    });
    
    if (!user) {
      user = await this.userService.createUser({
        walletAddress: userWalletAddress,
        name: registerUser.name,
        country: registerUser.country,
        twitterId: registerUser.twitterId,
        enterprise: registerUser.enterprise,
        image: registerUser.image,
        level: 0,
        experience: 0,
        reputation: 0,
        stars: 0,
        role: USER_ROLE,
      });
    }

    if (admin && user.role !== (ADMIN_ROLE as any)) {
      throw new UnauthorizedException({
        success: false,
        message: UNAUTHORIZED,
      });
    }

    const payload = user;
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: GLOBAL_CONFIG.security.expiresIn,
    });

    return {
      walletAddress: user.walletAddress,
      accessToken: accessToken,
    };
  }

  private isValidWalletAddress(walletAddress: string): boolean {
    return (
      ethers.isAddress(walletAddress) &&
      walletAddress.length === 42 &&
      walletAddress.startsWith('0x')
    );
  }
}

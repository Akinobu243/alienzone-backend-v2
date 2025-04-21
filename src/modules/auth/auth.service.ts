import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { GLOBAL_CONFIG } from '../../configs/global.config';

import { AuthResponseDTO, AuthUserDTO, RegisterUserDTO } from './dto/auth.dto';
import {
  INVALID_ACCESS_TOKEN,
  INVALID_WALLET_ADDRESS,
  MISSING_SIGNED_MESSAGE_OR_SIGNATURE,
  UNAUTHORIZED,
} from 'src/shared/constants/strings';
import { ADMIN_ROLE, USER_ROLE } from './auth.constants';
import { ethers } from 'ethers';
import { QuestService } from '../quest/quest.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private questService: QuestService,
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
      var referralCode = Math.random().toString(36).substring(2, 8);
      var existingUser = await this.userService.findUser({
        referralCode: referralCode,
      });

      while (existingUser) {
        referralCode = Math.random().toString(36).substring(2, 8);
        existingUser = await this.userService.findUser({
          referralCode: referralCode,
        });
      }

      const referrerCode = registerUser?.refferalCode || null;
      let referrer: User | null = null;

      if (referrerCode) {
        referrer = await this.userService.findUser({
          referralCode: referrerCode,
        });
      }

      const totalReferals = await this.prisma.user.count({
        where: {
          referrerId: referrer?.id,
        },
      });

      if (totalReferals === parseInt(process.env.MAX_REFFERAL_COUNT || '5')) {
        referrer = null;
      }

      user = await this.userService.createUser({
        walletAddress: userWalletAddress,
        name: registerUser.name,
        country: registerUser.country,
        twitterId: registerUser.twitterId || '',
        enterprise: registerUser.enterprise || '',
        referralCode: referralCode,
        referrerId: referrer?.id || null,
        image: registerUser.image || '',
        level: 1,
        experience: 0,
        reputation: 0,
        stars: 0,
        role: USER_ROLE,
      });

      if (referrer) {
        await this.prisma.$transaction([
          this.prisma.user.update({
            where: {
              id: referrer.id,
            },
            data: {
              stars: {
                increment: 40,
              },
            },
          }),
          this.prisma.referralReward.create({
            data: {
              referrerId: referrer.id,
              refereeId: user.id,
              starsEarned: 40,
            },
          }),
        ]);
      }
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

    try {
      await this.questService.progressLoginQuest(user.walletAddress);
    } catch (error) {
      console.error('Error progressing login quest:', error);
    }

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

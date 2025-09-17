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
  USER_BANNED,
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
      console.log('authUser.accessToken', authUser.accessToken);
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

      if (user.isBanned) {
        throw new UnauthorizedException({
          success: false,
          message: USER_BANNED,
        });
      }

      if (admin && user.role !== (ADMIN_ROLE as any)) {
        throw new UnauthorizedException({
          success: false,
          message: UNAUTHORIZED,
        });
      }

      if (!user.privyId && payload.privyId) {
        await this.userService.updateUser({
          where: { id: user.id },
          data: { privyId: payload.privyId },
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

    let user = await this.userService.findUser({
      walletAddress: userWalletAddress,
    });

    if (!user) {
      let referralCode = Math.random().toString(36).substring(2, 8);
      let existingUser = await this.userService.findUser({
        referralCode: referralCode,
      });

      while (existingUser) {
        referralCode = Math.random().toString(36).substring(2, 8);
        existingUser = await this.userService.findUser({
          referralCode: referralCode,
        });
      }

      // Check if email is already taken
      if (registerUser.email) {
        const userWithEmail = await this.userService.findUser({
          email: registerUser.email,
        });

        if (userWithEmail) {
          throw new BadRequestException({
            success: false,
            message: 'Email is already taken',
          });
        }
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
        email: registerUser.email,
        privyId: registerUser.privyId,
        country: registerUser.country,
        twitterId: registerUser.twitterId || '',
        enterprise: registerUser.enterprise || '',
        referralCode: referralCode,
        referrerId: referrer?.id || null,
        image: registerUser.image || '',
        level: 1,
        experience: 0,
        reputation: 0,
        stars: 250,
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

    if (!user.privyId) {
      await this.userService.updateUser({
        where: { id: user.id },
        data: { privyId: registerUser.privyId },
      });
      user.privyId = registerUser.privyId;
    }

    if (admin && user.role !== (ADMIN_ROLE as any)) {
      throw new UnauthorizedException({
        success: false,
        message: UNAUTHORIZED,
      });
    }

    if (user.isBanned) {
      throw new UnauthorizedException({
        success: false,
        message: USER_BANNED,
      });
    }

    const payload = user;
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: GLOBAL_CONFIG.security.expiresIn,
    });

    console.log('Progressing login quest for user:', user.walletAddress);
    const progressResponse = await this.questService.progressLoginQuest(
      user.walletAddress,
    );

    if (!progressResponse.success) {
      console.error(
        'Failed to progress login quest:',
        progressResponse.message,
      );
    } else {
      console.log(
        'Login quest progressed successfully for user:',
        user.walletAddress,
      );
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

import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

class CreateCheckoutDto {
  type: 'PACK' | 'ALIEN_PART' | 'STARS' | 'XP' | 'REP';
  itemId: number;
  quantity?: number;
}

@ApiTags('stripe')
@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private prisma: PrismaService,
  ) {}

  @Post('create-checkout')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a checkout session for purchase' })
  @ApiBody({ type: CreateCheckoutDto })
  async createCheckoutSession(@Body() body: CreateCheckoutDto, @Req() req) {
    // Get user from wallet address
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress: req.walletAddress.toLowerCase(),
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.stripeService.createCheckoutSession(
      user.id,
      body.type,
      body.itemId,
      body.quantity,
    );
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    if (!request.rawBody) {
      console.error('No raw body found in request');
      throw new Error('No raw body found in request');
    }

    try {
      return await this.stripeService.handleWebhook(signature, request.rawBody);
    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }

  @Get('verify-session')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Verify a checkout session status' })
  async verifySession(@Query('session_id') sessionId: string) {
    return this.stripeService.verifySession(sessionId);
  }
}

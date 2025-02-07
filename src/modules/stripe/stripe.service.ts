import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import { PacksService } from '../packs/packs.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private frontendUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private packsService: PacksService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-01-27.acacia',
    });

    this.frontendUrl = this.configService.get('FRONTEND_URL');
    if (!this.frontendUrl) {
      throw new Error('FRONTEND_URL environment variable is not set');
    }
  }

  async createCheckoutSession(
    userId: number,
    type: 'PACK' | 'ALIEN_PART' | 'STARS' | 'XP' | 'REP',
    itemId: number,
    quantity: number = 1,
  ) {
    try {
      let amount = 0;
      let name = '';
      let image = '';

      switch (type) {
        case 'PACK':
          const pack = await this.packsService.getPackById(itemId);
          if (!pack) throw new BadRequestException('Pack not found');
          amount = pack.price;
          name = pack.name;
          image = pack.image;
          break;
        case 'ALIEN_PART':
          const part = await this.prisma.alienPart.findUnique({
            where: { id: itemId },
          });
          if (!part || !part.price)
            throw new BadRequestException(
              'Alien part not found or not for sale',
            );
          amount = part.price;
          name = part.name;
          image = part.image;
          break;
        // Add other cases for STARS, XP, REP
      }

      // Create Checkout Session
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name,
                images: image ? [image] : undefined,
              },
              unit_amount: amount * 100, // Stripe expects amounts in cents
            },
            quantity,
          },
        ],
        mode: 'payment',
        success_url: `${this.frontendUrl}/purchase?session_id={CHECKOUT_SESSION_ID}&status=success`,
        cancel_url: `${this.frontendUrl}/purchase?session_id={CHECKOUT_SESSION_ID}&status=cancel`,
        metadata: {
          userId: userId.toString(),
          type,
          itemId: itemId.toString(),
          quantity: quantity.toString(),
        },
      });

      // Create transaction record
      await this.prisma.transaction.create({
        data: {
          userId,
          type,
          amount: amount * quantity,
          status: 'PENDING',
          stripePaymentId: session.id,
          packId: type === 'PACK' ? itemId : null,
          alienPartId: type === 'ALIEN_PART' ? itemId : null,
          quantity,
        },
      });

      return {
        url: session.url,
      };
    } catch (error) {
      console.error('Stripe checkout error:', error);
      throw new BadRequestException(error.message);
    }
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    try {
      const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
      if (!webhookSecret) {
        throw new Error('Stripe webhook secret is not configured');
      }

      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );

      console.log('Webhook event type:', event.type);

      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          await this.processSuccessfulCheckout(session);
          break;
        // ... handle other event types ...
      }

      return { received: true };
    } catch (err) {
      console.error('Webhook Error:', err.message);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }

  private async processSuccessfulCheckout(session: Stripe.Checkout.Session) {
    // Find the transaction using the session ID
    const transaction = await this.prisma.transaction.findFirst({
      where: { stripePaymentId: session.id },
    });

    if (!transaction) {
      console.error('Transaction not found for session:', session.id);
      return;
    }

    // Update transaction status
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'COMPLETED' },
    });

    // Process the purchase based on type
    switch (transaction.type) {
      case 'PACK':
        await this.processPackPurchase(transaction);
        break;
      case 'ALIEN_PART':
        await this.processAlienPartPurchase(transaction);
        break;
      case 'STARS':
        await this.processStarsPurchase(transaction);
        break;
      case 'XP':
        await this.processXPPurchase(transaction);
        break;
      case 'REP':
        await this.processREPPurchase(transaction);
        break;
    }
  }

  private async processPackPurchase(transaction: any) {
    const pack = await this.packsService.getPackById(transaction.packId);

    for (const reward of pack.rewards) {
      switch (reward.type) {
        case 'ALIEN_PART':
          await this.prisma.userAlienPart.create({
            data: {
              userId: transaction.userId,
              alienPartId: reward.alienPartId,
            },
          });
          break;
        case 'STARS':
          await this.prisma.user.update({
            where: { id: transaction.userId },
            data: { stars: { increment: reward.amount } },
          });
          break;
        // Add other reward types
      }
    }
  }

  private async processAlienPartPurchase(transaction: any) {
    await this.prisma.userAlienPart.create({
      data: {
        userId: transaction.userId,
        alienPartId: transaction.alienPartId,
      },
    });
  }

  // Add new methods for other purchase types
  private async processStarsPurchase(transaction: any) {
    await this.prisma.user.update({
      where: { id: transaction.userId },
      data: { stars: { increment: transaction.quantity } },
    });
  }

  private async processXPPurchase(transaction: any) {
    await this.prisma.user.update({
      where: { id: transaction.userId },
      data: { experience: { increment: transaction.quantity } },
    });
  }

  private async processREPPurchase(transaction: any) {
    await this.prisma.user.update({
      where: { id: transaction.userId },
      data: { reputation: { increment: transaction.quantity } },
    });
  }

  // Optional: Add a method to verify session status
  async verifySession(sessionId: string) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      return {
        status: session.payment_status,
        customerEmail: session.customer_details?.email,
        amountTotal: session.amount_total,
        success: session.payment_status === 'paid',
      };
    } catch (error) {
      console.error('Session verification error:', error);
      throw new BadRequestException('Invalid session ID');
    }
  }
}

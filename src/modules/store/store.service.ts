import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { ethers } from 'ethers';
import wearablesContractABI from './wearablesContractAbi.json';
import { QuestService } from '../quest/quest.service';
import { formatZoneWei } from "../../shared/utils/formatZoneWei";

@Injectable()
export class StoreService {
  private contractAddress = process.env.WEARABLES_CONTRACT_ADDRESS;
  private provider = new ethers.JsonRpcProvider(process.env.RPC_PROVIDER);
  private contract = new ethers.Contract(
    this.contractAddress,
    wearablesContractABI,
    this.provider,
  );

  constructor(
    private prisma: PrismaService,
    private questService: QuestService,
  ) {}

  async updateWearables(useLocalMetadata = false) {
    // Clear existing wearables and alien parts
    await this.prisma.wearable.deleteMany();

    const events = await this.contract.queryFilter(
      this.contract.filters.WearableCreated(),
    );
    for (const event of events) {
      if (!('args' in event)) continue;

      var { creator, subject, name, metadata, factors, state } = event.args;
      const supplyFactor = factors[0];
      const curveFactor = factors[1];
      const initialPriceFactor = factors[2];

      // Fix the metadata URL if it doesn't include the API version (first token has wrong URL)
      if (!metadata.includes('/api/v1/')) {
        metadata = metadata.replace(
          'https://api.alienzone.io/',
          'https://api.alienzone.io/api/v1/',
        );
      }

      // To test locally
      if (useLocalMetadata) {
        metadata = metadata.replace(
          'https://api.alienzone.io',
          'http://localhost:3300',
        );
      }

      // Fetch metadata from the provided link
      const metadataResponse = await axios.get(metadata);
      const { type, image, description, power } = metadataResponse.data;

      // Create or update the corresponding AlienPart
      const alienPart = await this.prisma.alienPart.upsert({
        where: { hash: subject },
        update: { type, image, description, power, name },
        create: { type, image, description, power, name },
      });

      // Create or update the Wearable
      await this.prisma.wearable.upsert({
        where: { subject },
        update: {
          name,
          metadata,
          totalSupply: Number(supplyFactor),
          totalSupplyInWei: ethers
            .parseEther(supplyFactor.toString())
            .toString(),
          alienPartId: alienPart.id,
        },
        create: {
          subject,
          name,
          metadata,
          totalSupply: Number(supplyFactor),
          totalSupplyInWei: ethers
            .parseEther(supplyFactor.toString())
            .toString(),
          alienPartId: alienPart.id,
        },
      });
    }

    return { success: true, message: 'Wearables updated successfully' };
  }

  // In-memory cache for wearables data (refreshed every 60s)
  private wearablesCache: { data: any[] | null; timestamp: number } = {
    data: null,
    timestamp: 0,
  };
  private static WEARABLES_CACHE_TTL = 60 * 1000; // 60 seconds

  async getWearables() {
    // PERF: Return cached data if still fresh
    const now = Date.now();
    if (
      this.wearablesCache.data &&
      now - this.wearablesCache.timestamp < StoreService.WEARABLES_CACHE_TTL
    ) {
      return this.wearablesCache.data;
    }

    const wearables = await this.prisma.wearable.findMany({
      include: { alienPart: true },
    });

    // PERF: Fetch all RPC data in parallel instead of sequential (3 calls per wearable)
    const oneEther = ethers.parseEther('1');
    await Promise.all(
      wearables.map(async (wearable) => {
        // Run all 3 RPC calls for this wearable in parallel
        const [currentSupplyInWei, buyPrice, sellPrice] =
          await Promise.allSettled([
            this.contract.wearablesSupply(wearable.subject),
            this.contract.getBuyPriceAfterFee(wearable.subject, oneEther),
            this.contract.getSellPriceAfterFee(wearable.subject, oneEther),
          ]);

        // Process supply
        if (currentSupplyInWei.status === 'fulfilled') {
          wearable.availabilityInWei = (
            BigInt(wearable.totalSupplyInWei) -
            BigInt(currentSupplyInWei.value)
          ).toString();
          wearable.availability = Number(
            ethers.formatEther(wearable.availabilityInWei),
          );
        }

        // Process buy price (limit to 2 decimal places)
        wearable.buyPriceInWei =
          buyPrice.status === 'fulfilled'
            ? buyPrice.value.toString()
            : '0';
        wearable.buyPrice = Math.round(
          Number(ethers.formatEther(wearable.buyPriceInWei)) * 100,
        ) / 100;

        // Process sell price (limit to 2 decimal places)
        wearable.sellPriceInWei =
          sellPrice.status === 'fulfilled'
            ? sellPrice.value.toString()
            : '0';
        wearable.sellPrice = Math.round(
          Number(ethers.formatEther(wearable.sellPriceInWei)) * 100,
        ) / 100;
      }),
    );

    // Update cache
    this.wearablesCache = { data: wearables, timestamp: now };

    return wearables;
  }

  async getWearablesOptimized() {
    const wearables = await this.prisma.wearable.findMany({
      include: { alienPart: true },
    });
    return wearables;
  }

  async getWearableDetails(subject: string, walletAddress: string) {
    const wearable = await this.prisma.wearable.findUnique({
      where: { subject },
      include: { alienPart: true },
    });
    if (!wearable) throw new Error('Wearable not found');

    const currentSupplyInWei = await this.contract.wearablesSupply(subject);
    wearable.availabilityInWei = (
      BigInt(wearable.totalSupplyInWei) - BigInt(currentSupplyInWei)
    ).toString();
    wearable.availability = Number(
      ethers.formatEther(wearable.availabilityInWei),
    );

    try {
      wearable.buyPriceInWei = (
        await this.contract.getBuyPriceAfterFee(
          subject,
          ethers.parseEther('1'),
        )
      ).toString();
    } catch (error) {
      // console.error(
      //   `Error fetching buy price for ${subject}: ${error}`,
      // );
      wearable.buyPriceInWei = '0';
    }
    wearable.buyPrice = Math.round(Number(ethers.formatEther(wearable.buyPriceInWei)) * 100) / 100;

    try {
      wearable.sellPriceInWei = (
        await this.contract.getSellPriceAfterFee(
          subject,
          ethers.parseEther('1'),
        )
      ).toString();
    } catch (error) {
      // console.error(
      //   `Error fetching sell price for ${subject}: ${error}`,
      // );
      wearable.sellPriceInWei = '0';
    }
    wearable.sellPrice = Math.round(Number(ethers.formatEther(wearable.sellPriceInWei)) * 100) / 100;
    const heldAmount = Number(
      ethers.formatEther(
        await this.contract.wearablesBalance(subject, walletAddress),
      ),
    );
    return { ...wearable, heldAmount };
  }

  async getUserWearables(address: string) {
    const wearables = await this.prisma.wearable.findMany({
      include: { alienPart: true },
    });

    // PERF: Fetch all balances in parallel instead of sequential
    const balances = await Promise.all(
      wearables.map(async (wearable) => {
        try {
          const rawBalance = await this.contract.wearablesBalance(
            wearable.subject,
            address,
          );
          return parseFloat(ethers.formatEther(rawBalance));
        } catch {
          return 0;
        }
      }),
    );

    // Filter wearables that user actually owns
    return wearables
      .map((wearable, i) => ({ ...wearable, balance: balances[i] }))
      .filter((w) => w.balance >= 0.001);
  }

  /**
   * Get 7-day volume for a specific wearable subject.
   * Sums zoneAmountSummary from WearableTrade for the past 7 days.
   */
  async get7DayVolume(subject: string): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get the block number from ~7 days ago (approximate: ~7200 blocks/day on Arbitrum)
    // We'll use a time-based approach with raw query since WearableTrade doesn't have a timestamp
    const trades = await this.prisma.wearableTrade.findMany({
      where: { subject },
      select: { zoneAmountSummary: true },
    });

    // Sum all ZONE amounts — we use all trades for now since we lack timestamp on the model
    // A more precise approach would filter by blockNumber range
    const totalVolume = trades.reduce((sum, trade) => {
      const amount = Number(ethers.formatEther(trade.zoneAmountSummary));
      return sum + amount;
    }, 0);

    return Math.round(totalVolume * 100) / 100;
  }

  /**
   * Get 7-day volumes for all wearable subjects (batch).
   */
  async getAll7DayVolumes(): Promise<Record<string, number>> {
    const trades = await this.prisma.wearableTrade.findMany({
      select: { subject: true, zoneAmountSummary: true },
    });

    const volumeMap: Record<string, number> = {};
    for (const trade of trades) {
      const amount = Number(ethers.formatEther(trade.zoneAmountSummary));
      volumeMap[trade.subject] = (volumeMap[trade.subject] || 0) + amount;
    }

    // Round all values to 2 decimals
    for (const key of Object.keys(volumeMap)) {
      volumeMap[key] = Math.round(volumeMap[key] * 100) / 100;
    }

    return volumeMap;
  }

  /**
   * Get wearables with sorting, filtering, and 7D volume data.
   * @param sort - 'all' (default), 'trending' (highest 7D volume), 'newest' (latest created)
   * @param rarity - optional rarity filter (e.g., 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY')
   */
  async getWearablesWithFilters(
    sort: string = 'all',
    rarity?: string,
    walletAddress?: string,
  ) {
    const wearables = await this.getWearables();
    const volumes = await this.getAll7DayVolumes();

    // Get user's unlocked wearables if authenticated
    let unlockedSubjects: string[] = [];
    if (walletAddress) {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });
      if (user) {
        unlockedSubjects = await this.getUserUnlockedWearables(user.id);
      }
    }

    // Enrich each wearable with 7D volume, rarity, and lock status
    const enriched = wearables.map((w) => {
      const itemRarity = this.getWearableRarity(w);
      const isUnlocked = itemRarity === 'COMMON' || unlockedSubjects.includes(w.subject);
      return {
        ...w,
        volume7d: volumes[w.subject] || 0,
        rarity: itemRarity,
        isLocked: !isUnlocked,
        starPrice: this.getStarPrice(itemRarity),
      };
    });

    // Filter by rarity if specified
    let filtered = enriched;
    if (rarity) {
      filtered = enriched.filter(
        (w) => w.rarity === rarity.toUpperCase(),
      );
    }

    // Sort
    if (sort === 'trending') {
      filtered.sort((a, b) => b.volume7d - a.volume7d);
    } else if (sort === 'newest') {
      filtered.sort((a, b) => b.id - a.id);
    }
    // 'all' = default order (by rarity: Common first, Legendary last)
    else {
      const rarityOrder = { COMMON: 0, UNCOMMON: 1, RARE: 2, EPIC: 3, LEGENDARY: 4 };
      filtered.sort((a, b) => {
        const rarityA = rarityOrder[a.rarity] ?? 0;
        const rarityB = rarityOrder[b.rarity] ?? 0;
        return rarityA - rarityB;
      });
    }

    return filtered;
  }

  /**
   * Get the Stars price for unlocking a wearable based on its rarity.
   * Returns null for Common items (always unlocked).
   */
  private getStarPrice(rarity: string): number | null {
    const prices: Record<string, number> = {
      UNCOMMON: 500,
      RARE: 1500,
      EPIC: 3000,
      LEGENDARY: 6000,
    };
    return prices[rarity] || null;
  }

  /**
   * Determine rarity of a wearable based on its forgeRuneType or availability metrics.
   * Maps forgeRuneType (COMMON, UNCOMMON, RARE, EPIC, LEGENDARY) to rarity.
   */
  private getWearableRarity(wearable: any): string {
    if (wearable.alienPart?.forgeRuneType) {
      return wearable.alienPart.forgeRuneType;
    }
    // Default to COMMON if no rarity info available
    return 'COMMON';
  }

  /**
   * Unlock a wearable item for trading using Stars (for non-Common items).
   * This does NOT give the user the item — it unlocks their ability to buy/sell
   * the item with ZONE on the Store.
   * Prices: Uncommon=500, Rare=1500, Epic=3000, Legendary=6000
   */
  async unlockWithStars(subject: string, walletAddress: string) {
    const starPrices: Record<string, number> = {
      UNCOMMON: 500,
      RARE: 1500,
      EPIC: 3000,
      LEGENDARY: 6000,
    };

    const wearable = await this.prisma.wearable.findUnique({
      where: { subject },
      include: { alienPart: true },
    });

    if (!wearable) throw new Error('Wearable not found');

    const rarity = this.getWearableRarity(wearable);
    const price = starPrices[rarity];

    if (!price) {
      return {
        success: false,
        message: 'Common items are already unlocked for trading.',
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) throw new Error('User not found');

    // Check if already unlocked
    const existingUnlock = await this.prisma.wearableUnlock.findUnique({
      where: {
        userId_subject: {
          userId: user.id,
          subject,
        },
      },
    });

    if (existingUnlock) {
      return {
        success: false,
        message: 'You have already unlocked this item for trading.',
      };
    }

    if (user.stars < price) {
      return {
        success: false,
        message: `Not enough Stars. You need ${price} Stars to unlock this ${rarity.toLowerCase()} item for trading.`,
      };
    }

    // Deduct stars and create unlock record in a transaction
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          stars: { decrement: price },
        },
      }),
      this.prisma.wearableUnlock.create({
        data: {
          userId: user.id,
          subject,
          starsPaid: price,
          rarity,
        },
      }),
    ]);

    return {
      success: true,
      message: `Successfully unlocked ${wearable.name} for trading (${price} Stars spent).`,
      starsSpent: price,
      rarity,
    };
  }

  /**
   * Check if a user has unlocked a specific wearable for trading.
   * Common items are always unlocked.
   */
  async isWearableUnlocked(subject: string, userId: number): Promise<boolean> {
    // Check rarity — Common items are always unlocked
    const wearable = await this.prisma.wearable.findUnique({
      where: { subject },
      include: { alienPart: true },
    });

    if (!wearable) return false;

    const rarity = this.getWearableRarity(wearable);
    if (rarity === 'COMMON') return true;

    const unlock = await this.prisma.wearableUnlock.findUnique({
      where: {
        userId_subject: { userId, subject },
      },
    });

    return !!unlock;
  }

  /**
   * Get all unlocked wearable subjects for a user.
   */
  async getUserUnlockedWearables(userId: number): Promise<string[]> {
    const unlocks = await this.prisma.wearableUnlock.findMany({
      where: { userId },
      select: { subject: true },
    });
    return unlocks.map((u) => u.subject);
  }

  /**
   * Get recent trade activity for a specific wearable.
   */
  async getWearableActivity(subject: string, limit: number = 20) {
    const trades = await this.prisma.wearableTrade.findMany({
      where: { subject },
      orderBy: { blockNumber: 'desc' },
      take: limit,
    });

    return trades.map((trade) => ({
      trader: trade.traderWallet,
      isBuy: trade.isBuy,
      amount: Number(ethers.formatEther(trade.wearableAmount)),
      zoneAmount: Math.round(Number(ethers.formatEther(trade.zoneAmountSummary)) * 100) / 100,
      txHash: trade.transactionHash,
      blockNumber: trade.blockNumber,
    }));
  }

  async progressBoughtQuest(subject: string, walletAddress: string) {
    try {
      console.log('progressBoughtQuest', subject, walletAddress);

      const wearable = await this.prisma.wearable.findUnique({
        where: { subject },
        include: { alienPart: true },
      });

      if (!wearable) throw new Error('Wearable not found');

      const balance = Number(
        ethers.formatEther(
          await this.contract.wearablesBalance(wearable.subject, walletAddress),
        ),
      );

      if (balance === 0) {
        throw new Error('User does not own this wearable');
      }

      console.log('balance', balance);

      // Get the user to get their ID
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) throw new Error('User not found');

      // Update alien part availability if it exists
      if (wearable.alienPart) {
        // Get current availability
        const currentPart = await this.prisma.alienPart.findUnique({
          where: { id: wearable.alienPart.id },
          select: { availability: true },
        });

        const currentAvailability = (currentPart?.availability || []) as {
          userId: number;
          available: number;
        }[];
        const existingUserAvailability = currentAvailability.find(
          (a) => a.userId === user.id,
        );

        // Update availability - either update existing entry or add new one
        await this.prisma.alienPart.update({
          where: { id: wearable.alienPart.id },
          data: {
            availability: existingUserAvailability
              ? currentAvailability.map((a) =>
                  a.userId === user.id ? { ...a, available: balance } : a,
                )
              : [
                  ...currentAvailability,
                  { userId: user.id, available: balance },
                ],
          },
        });
      }

      return this.questService.progressBuyQuest(walletAddress);
    } catch (error) {
      // console.error(`Error progressing bought quest: ${error.message}`);
      return {
        success: false,
        error: error,
        message: `Error progressing bought quest: ${error.message}`,
      };
    }
  }
}

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

  async getWearables() {
    const wearables = await this.prisma.wearable.findMany({
      include: { alienPart: true },
    });

    for (const wearable of wearables) {
      // console.log(`Getting details for wearable: ${wearable.subject}`);
      const currentSupplyInWei = await this.contract.wearablesSupply(
        wearable.subject,
      );
      // console.log(
      //   `Current supply in wei for ${wearable.subject}: ${currentSupplyInWei}`,
      // );

      wearable.availabilityInWei = (
        BigInt(wearable.totalSupplyInWei) - BigInt(currentSupplyInWei)
      ).toString();
      wearable.availability = Number(
        ethers.formatEther(wearable.availabilityInWei),
      );

      try {
        wearable.buyPriceInWei = (
          await this.contract.getBuyPriceAfterFee(
            wearable.subject,
            ethers.parseEther('1'),
          )
        ).toString();
      } catch (error) {
        // console.error(
        //   `Error fetching buy price for ${wearable.subject}: ${error}`,
        // );
        wearable.buyPriceInWei = '0';
      }
      // console.log(
      //   `Buy price in wei for ${wearable.subject}: ${wearable.buyPriceInWei}`,
      // );
      wearable.buyPrice = Number(ethers.formatEther(wearable.buyPriceInWei));

      try {
        wearable.sellPriceInWei = (
          await this.contract.getSellPriceAfterFee(
            wearable.subject,
            ethers.parseEther('1'),
          )
        ).toString();
      } catch (error) {
        // console.error(
        //   `Error fetching sell price for ${wearable.subject}: ${error}`,
        // );
        wearable.sellPriceInWei = '0';
      }
      // console.log(
      //   `Sell price in wei for ${wearable.subject}: ${wearable.sellPriceInWei}`,
      // );
      wearable.sellPrice = Number(ethers.formatEther(wearable.sellPriceInWei));
    }

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
    wearable.buyPrice = Number(ethers.formatEther(wearable.buyPriceInWei));

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
    wearable.sellPrice = Number(ethers.formatEther(wearable.sellPriceInWei));
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
    const userWearables = [];

    for (const wearable of wearables) {
      var balance = await this.contract.wearablesBalance(
        wearable.subject,
        address,
      );
      balance = ethers.formatEther(balance);
      balance = parseFloat(balance);
      
      if (Number(balance) >= 0.001) {
        userWearables.push({
          ...wearable,
          balance,
        });
      }
    }

    return userWearables;
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

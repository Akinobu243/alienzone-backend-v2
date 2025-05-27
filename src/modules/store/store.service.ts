import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { ethers } from 'ethers';
import wearablesContractABI from './wearablesContractAbi.json';

@Injectable()
export class StoreService {
  private contractAddress = process.env.WEARABLES_CONTRACT_ADDRESS;
  private provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_PROVIDER);
  private contract = new ethers.Contract(
    this.contractAddress,
    wearablesContractABI,
    this.provider,
  );

  constructor(private prisma: PrismaService) {}

  async updateWearables(useLocalMetadata = false) {
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
          alienPartId: alienPart.id,
        },
        create: {
          subject,
          name,
          metadata,
          totalSupply: Number(supplyFactor),
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
      wearable.totalSupply = Number(
        await this.contract.wearablesSupply(wearable.subject),
      );
    }

    return wearables;
  }

  async getWearableDetails(subject: string) {
    const wearable = await this.prisma.wearable.findUnique({
      where: { subject },
      include: { alienPart: true },
    });
    if (!wearable) throw new Error('Wearable not found');

    const currentSupply = Number(await this.contract.wearablesSupply(subject));
    const buyPrice = Number(
      await this.contract.getBuyPrice(subject, ethers.parseEther('0.001')),
    );
    const sellPrice = 0; // TODO: debug issue with getSellPrice
    // await this.contract.getSellPrice(
    //   subject,
    //   ethers.parseEther('0.001'),
    // );

    return {
      ...wearable,
      currentSupply,
      buyPrice,
      sellPrice,
    };
  }

  async getUserWearables(address: string) {
    const wearables = await this.prisma.wearable.findMany({
      include: { alienPart: true },
    });
    const userWearables = [];

    for (const wearable of wearables) {
      const balance = await this.contract.wearablesBalance(
        wearable.subject,
        address,
      );
      if (Math.floor(Number(balance)) > 0) {
        userWearables.push({
          ...wearable,
          balance: Math.floor(Number(balance)),
        });
      }
    }

    return userWearables;
  }
}

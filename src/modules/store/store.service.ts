import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { ethers } from 'ethers';
import wearablesContractABI from './wearablesContractABI.json';

@Injectable()
export class StoreService {
  private contractAddress = process.env.WEARABLES_CONTRACT_ADDRESS;
  private provider = new ethers.JsonRpcProvider(process.env.RPC_PROVIDER);
  private contract = new ethers.Contract(
    this.contractAddress,
    wearablesContractABI,
    this.provider,
  );

  constructor(private prisma: PrismaService) {}

  async updateWearables() {
    const events = await this.contract.queryFilter(
      this.contract.filters.WearableCreated(),
    );
    for (const event of events) {
      if (!('args' in event)) continue;

      const { subject, name, metadata, factors } = event.args;

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
          totalSupply: factors.supplyFactor,
          alienPartId: alienPart.id,
        },
        create: {
          subject,
          name,
          metadata,
          totalSupply: factors.supplyFactor,
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
      wearable.totalSupply = await this.contract.wearablesSupply(
        wearable.subject,
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

    const currentSupply = await this.contract.wearablesSupply(subject);
    const buyPrice = await this.contract.getBuyPrice(subject, 1);
    const sellPrice = await this.contract.getSellPrice(subject, 1);

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
      if (balance > 0) {
        userWearables.push({ ...wearable, balance });
      }
    }

    return userWearables;
  }
}

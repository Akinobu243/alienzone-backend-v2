import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import axios from 'axios';
import wearablesContractABI from '../../src/modules/store/wearablesContractAbi.json';

export async function seed(prisma: PrismaClient) {
  const contractAddress = process.env.WEARABLES_CONTRACT_ADDRESS;
  const provider = new ethers.JsonRpcProvider(process.env.RPC_PROVIDER);
  const contract = new ethers.Contract(
    contractAddress,
    wearablesContractABI,
    provider,
  );

  try {
    // Clear existing wearables and alien parts
    await prisma.wearable.deleteMany();

    const events = await contract.queryFilter(
      contract.filters.WearableCreated(),
    );

    for (const event of events) {
      if (!('args' in event)) continue;

      const { creator, subject, name, metadata, factors, state } = event.args;
      const supplyFactor = factors[0];
      const curveFactor = factors[1];
      const initialPriceFactor = factors[2];

      // Skipping old test wearables
      if (name === 'Zone Cap' || name === "Akairo's Lands") {
        continue;
      }

      let metadataUrl = metadata;
      // Fix the metadata URL if it doesn't include the API version (first token has wrong URL)
      if (!metadataUrl.includes('/api/v1/')) {
        metadataUrl = metadataUrl.replace(
          'https://api.alienzone.io/',
          'https://api.alienzone.io/api/v1/',
        );
      }

      let metadataData;
      try {
        // Try to fetch metadata from the provided link
        const metadataResponse = await axios.get(metadataUrl, {
          timeout: 5000, // 5 second timeout
        });
        metadataData = metadataResponse.data;
      } catch (error) {
        console.error(
          `Failed to fetch metadata for ${name}, skipping this item`,
        );
        continue; // Skip this iteration if metadata fetch fails
      }

      const { type, image, description, power } = metadataData;

      // Create or update the corresponding AlienPart
      const alienPart = await prisma.alienPart.upsert({
        where: { hash: subject },
        update: { type, image, description, power, name },
        create: { type, image, description, power, name },
      });

      // Create or update the Wearable
      await prisma.wearable.upsert({
        where: { subject },
        update: {
          name,
          metadata: metadataUrl,
          totalSupply: Number(supplyFactor),
          totalSupplyInWei: ethers
            .parseEther(supplyFactor.toString())
            .toString(),
          alienPartId: alienPart.id,
        },
        create: {
          subject,
          name,
          metadata: metadataUrl,
          totalSupply: Number(supplyFactor),
          totalSupplyInWei: ethers
            .parseEther(supplyFactor.toString())
            .toString(),
          alienPartId: alienPart.id,
        },
      });
    }

    console.log('Store items seeded successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

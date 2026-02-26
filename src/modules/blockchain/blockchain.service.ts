import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class BlockchainService {
  constructor() {}


  async get_arbitrum_http() {
    let provider = new ethers.JsonRpcProvider(process.env.RPC_PROVIDER);

    return provider
  }
}

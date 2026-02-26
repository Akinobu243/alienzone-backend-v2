import { Injectable } from "@nestjs/common";
import { ethers, EventLog, JsonRpcApiProvider, Log } from "ethers";
import { PrismaService } from "../prisma/prisma.service";
import { BlockchainService } from "./blockchain.service";
import { WEARABLES_ARBITRUM } from "../../shared/constants/blockchan.addresses";
import { WEARABLES_ABI } from "./abi/wearables_abi";
import { Cron, CronExpression } from "@nestjs/schedule";

interface TradeEvent {
  traderWallet: string,
  subject: string,
  isBuy: boolean,
  wearableAmount: string,
  zoneAmountSummary: string,
  blockNumber: number,
  transactionHash: string,
  logIndex: number
}

@Injectable()
export class WearableTradeEventParser {
  private provider: JsonRpcApiProvider;
  private readonly TRACKER_ID = "default";
  private wearables_contract: ethers.Contract;
  private last_processed_block: number;
  private processing_now: boolean = false;


  constructor(
    private prisma: PrismaService,
    private providers_service: BlockchainService
  ) {
  }


  async onModuleInit() {
    this.processing_now = true;

    this.provider = await this.providers_service.get_arbitrum_http();
    this.wearables_contract = new ethers.Contract(
      WEARABLES_ARBITRUM,
      WEARABLES_ABI,
      this.provider
    );

    this.last_processed_block = await this.get_last_processed_block()
    this.processing_now = false;

    await this.parse_events();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async parse_events() {
    if (this.processing_now == true) {
      return;
    }

    this.processing_now = true;

    const block_from = this.last_processed_block + 1;
    const block_to = await this.provider.getBlockNumber();

    const events = await this.wearables_contract.queryFilter(
      "Trade",
      block_from,
      block_to
    );

    const parsed_events: TradeEvent[] = [];

    for (let _event of events) {
      let parsed = this.parseEventLog(_event);
      parsed_events.push(parsed);
    }

    await this.saveEvents(parsed_events, block_to)

    this.last_processed_block = block_to;
    this.processing_now = false;
  }

  private async saveEvents(events: TradeEvent[], new_last_processed_block: number) {
    let tx = this.prisma.$transaction(async (prisma) => {
      const newTrades = prisma.wearableTrade.createMany({
        data: events
      })

      const updatedTracker = await prisma.wearableTradeTrackerState.update({
        where: { id: 'default' },
        data: { lastProcessedBlock: new_last_processed_block }
      });

      return { newTrades, updatedTracker };
    })

    await tx
  }

  private async get_last_processed_block(): Promise<number> {
    const state = await this.prisma.wearableTradeTrackerState.findFirst({
      where: { id: this.TRACKER_ID }
    });

    if (!state) {
      await this.prisma.wearableTradeTrackerState.create({
        data: {
          id: this.TRACKER_ID,
          lastProcessedBlock: Number(process.env.WEARABLES_CONTRACT_DEPLOY_BLOCK),
        }
      })
      return Number(process.env.WEARABLES_CONTRACT_DEPLOY_BLOCK)
    }

    return state.lastProcessedBlock
  }

  private parseEventLog(
    log: EventLog | Log
  ): TradeEvent {
    if (log instanceof EventLog) {
      return {
        traderWallet: log.args.trader,
        subject: log.args.subject,
        isBuy: log.args.isBuy,
        wearableAmount: log.args.wearableAmount,
        zoneAmountSummary: log.args.zoneAmount + log.args.protocolZoneAmount + log.args.creatorZoneAmount,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        logIndex: log.index
      };
    }

    const parsed = this.wearables_contract.interface.parseLog({
      data: log.data,
      topics: [...log.topics]
    });

    if (!parsed) {
      throw new Error("Unable to parse event log");
    }

    return {
      traderWallet: parsed.args.trader,
      subject: parsed.args.subject,
      isBuy: parsed.args.isBuy,
      wearableAmount: parsed.args.wearableAmount,
      zoneAmountSummary: parsed.args.zoneAmount + parsed.args.protocolZoneAmount + parsed.args.creatorZoneAmount,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      logIndex: log.index
    };
  }

}

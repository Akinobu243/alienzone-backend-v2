import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ethers, JsonRpcApiProvider } from "ethers";

import { BlockchainService } from "../../blockchain/blockchain.service";
import { UniswapV3QuoterV2Abi } from "../../blockchain/abi/uniswap_v3_quoter_v2_abi";
import { UNISWAP_V2_ROUTER_ABI } from "../../blockchain/abi/uniswap_v2_router_abi";
import {
  ALIENZONE_VIEW_HELPER_ARBITRUM,
  USDT_ARBITRUM,
  WETH_ARBITRUM,
  ZONE_TOKEN_ARBITRUM
} from "../../../shared/constants/blockchan.addresses";
import axios from "axios";
import { ALIENZONE_VIEW_HELPER_ABI } from "../../blockchain/abi/alienzone_view_helper.abi";
import { PrismaService } from "../../prisma/prisma.service";
import { calculateWearablesProfit, CalcWearablesProfitReturn } from "./calc-dojo-itmes-profit";
import { formatUsdtWei } from "../../../shared/utils/formatUsdtWei";
import { formatZoneWei, formatZoneWei2, formatZoneWei3 } from "../../../shared/utils/formatZoneWei";
import { formatNumPercentage } from "../../../shared/utils/formatNumPercentage";

const avg_blocks_for_24h = 7250;

const zone_token_amount_for_price = BigInt("10000000000000000000000"); // 10.000 zone
const MATCHA_API_KEY = process.env.MATCHA_API_KEY;
const BIG_INT_ZERO = BigInt(0);
const MIN_ZONE_BALANCE = BigInt("1000000000000000000");
const ALIEN_PRICE_WEI = BigInt("10000000000000000000000");

export interface WearableView {
  name: string;
  amount: string;
  picture_url: string;
  price?: string;
  price_diff_percentage?: string;
  price_diff_positive?: boolean;
}

export interface GetPortfolioReturn {
  balance_summary: string;
  balance_usd: string;
  usd_balance_diff_positive?: boolean;
  usd_balance_diff?: string;
  usd_diff_percentage?: string;
  wallet_zone_balance: string;
  items: WearableView[];
  characters: { name: string; price: string; picture_url: string; }[];
}

// 24h - 24h before

@Injectable()
export class PortfolioService {
  private provider: JsonRpcApiProvider;
  private quoter_uni_v2: ethers.Contract;
  private quoter_uni_v3: ethers.Contract;
  private alienzone_view_helper_contract: ethers.Contract;

  private wearable_subjects: string[] = [];
  private wearable_price: Map<string, bigint> = new Map(); // subject => price
  private wearable_price_24h: Map<string, bigint> = new Map(); // subject => price
  private wearable_metadata: Map<string, [string, string]> = new Map(); // subject => [name, picture_url]

  private current_block: number;
  private past_block: number;

  private current_usdt_price: bigint;
  private past_usdt_price: bigint;

  constructor(
    private providers_service: BlockchainService,
    private prisma: PrismaService
  ) {
  }

  async onModuleInit() {
    this.provider = await this.providers_service.get_arbitrum_http();
    this.quoter_uni_v3 = new ethers.Contract(
      "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
      UniswapV3QuoterV2Abi,
      this.provider
    );
    this.quoter_uni_v2 = new ethers.Contract(
      "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
      UNISWAP_V2_ROUTER_ABI,
      this.provider
    );
    this.alienzone_view_helper_contract = new ethers.Contract(
      ALIENZONE_VIEW_HELPER_ARBITRUM,
      ALIENZONE_VIEW_HELPER_ABI,
      this.provider
    );

    await this.update_prices();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async update_prices() {
    this.current_block = await this.provider.getBlockNumber();
    this.past_block = this.current_block - avg_blocks_for_24h;

    await Promise.all([this.update_wearable_prices(), this.update_zone_prices()]);
  }


  private async update_wearable_prices() {
    const wearables = await this.prisma.wearable.findMany({
      include: { alienPart: true }
    });

    const subjects = wearables.map(wearable => wearable.subject);

    const prices_req: Promise<bigint[]> = this.alienzone_view_helper_contract.wearableSellPriceBatched(subjects);
    const prices_24h_req: Promise<bigint[]> = this.alienzone_view_helper_contract.wearableSellPriceBatched(subjects, { blockTag: this.past_block });

    const [prices, prices_24h] = await Promise.all([prices_req, prices_24h_req]);

    for (let i = 0; i < subjects.length; i++) {
      this.wearable_price.set(subjects[i], prices[i]);
      this.wearable_price_24h.set(subjects[i], prices_24h[i]);
      this.wearable_metadata.set(subjects[i], [wearables[i].name, wearables[i].alienPart.image]);
    }
    this.wearable_subjects = subjects;
  }


  private async update_zone_prices() {
    let res_zone_weth_past_block = await this.quoter_uni_v2.getAmountsOut.staticCall(
      zone_token_amount_for_price,
      [
        ZONE_TOKEN_ARBITRUM,
        WETH_ARBITRUM
      ],
      {
        blockTag: this.past_block
      }
    );

    let amount_out_weth = res_zone_weth_past_block[1];

    let req_usdt_past_block = await this.quoter_uni_v3.quoteExactInputSingle.staticCall(
      {
        tokenIn: WETH_ARBITRUM,
        tokenOut: USDT_ARBITRUM,
        fee: 3000,
        amountIn: amount_out_weth,
        sqrtPriceLimitX96: "0"
      },
      {
        blockTag: this.past_block
      }
    );

    const req_matcha_price = axios.get<TokenPriceMatchaResponse>(
      "https://api.0x.org/swap/allowance-holder/price",
      {
        headers: {
          "0x-api-key": MATCHA_API_KEY,
          "0x-version": "v2"
        },
        params: {
          buyToken: USDT_ARBITRUM,
          sellToken: ZONE_TOKEN_ARBITRUM,
          sellAmount: zone_token_amount_for_price,
          chainId: "42161"
        }
      }
    );

    const [usdt_out_past_block, matcha_res] = await Promise.all([req_usdt_past_block, req_matcha_price]);

    const usdt_received_matcha = BigInt(matcha_res.data.buyAmount) + BigInt(matcha_res.data.fees.zeroExFee.amount);

    this.current_usdt_price = calculateZonePriceInUSDT(zone_token_amount_for_price, usdt_received_matcha);
    this.past_usdt_price = calculateZonePriceInUSDT(zone_token_amount_for_price, usdt_out_past_block[0]);
  }


  async getPortfolio(walletAddress: string) {
    // blockchain requests
    // zone balance
    const wallet_balances = await this.getWalletBalances(walletAddress);

    const [
      zone_balance,
      nftIds,
      wearables
    ] = [
      wallet_balances.balances.zone_balance,
      wallet_balances.balances.nftIds,
      wallet_balances.balances.wearables
    ];


    const [
      zone_balance_24h,
      nftIds_24h,
      wearables_24h
    ] = [
      wallet_balances.balances_24h.zone_balance,
      wallet_balances.balances_24h.nftIds,
      wallet_balances.balances_24h.wearables
    ];

    let zone_balance_cumulative = zone_balance;
    let zone_balance_cumulative_24h = zone_balance_24h;

    if (nftIds.length != 0) {
      zone_balance_cumulative += BigInt(nftIds.length) * ALIEN_PRICE_WEI;
    }

    if (nftIds_24h.length != 0) {
      zone_balance_cumulative_24h += BigInt(nftIds_24h.length) * ALIEN_PRICE_WEI;
    }

    const dojo_items_zone_volume = wearables.reduce((acc, val) => {
      const price = this.wearable_price.get(val.subject);
      if (!price) {
        return acc;
      }
      return acc + (val.balance * price) / one_eth;
    }, BIG_INT_ZERO);


    const dojo_items_zone_volume_24h = wearables_24h.reduce((acc, val) => {
      const price = this.wearable_price_24h.get(val.subject);
      if (!price) {
        return acc;
      }

      return acc + (val.balance * price) / one_eth;
    }, BIG_INT_ZERO);

    zone_balance_cumulative += dojo_items_zone_volume;
    zone_balance_cumulative_24h += dojo_items_zone_volume_24h;

    let balance_summary_str: string;
    let wallet_zone_balance_str: string;
    let balance_usd_str: string;
    let usd_difference_str: string;
    let usd_balance_diff_percentage_str: string;
    let usd_balance_diff_positive: boolean;

    if (zone_balance_cumulative > MIN_ZONE_BALANCE) {
      const usd_balance = calcZoneBalanceInUsdt(zone_balance_cumulative, this.current_usdt_price);
      balance_summary_str = formatZoneWei2(zone_balance_cumulative);
      balance_usd_str = formatUsdtWei(usd_balance);
      wallet_zone_balance_str = formatZoneWei(wallet_balances.balances.zone_balance);

      if (zone_balance_cumulative_24h >= MIN_ZONE_BALANCE) {
        let usd_balance_24h = calcZoneBalanceInUsdt(zone_balance_cumulative_24h, this.past_usdt_price);
        const diff = calculateBalanceChange(usd_balance, usd_balance_24h);
        if (diff.absolute != BIG_INT_ZERO) {
          usd_difference_str = formatUsdtWei(diff.absolute);
          usd_balance_diff_percentage_str = formatNumPercentage(diff.percentage);
          usd_balance_diff_positive = diff.isPositive;
        }
      }
    } else {
      balance_summary_str = "0";
      balance_usd_str = "0";
      wallet_zone_balance_str = "0";
    }


    let characters = nftIds.map(nftId => {
      return {
        name: `Alien #${nftId}`,
        price: "10,000 ZONE",
        picture_url: `https://alienzone-nft-images.s3.eu-west-3.amazonaws.com/Alien/${nftId}.png`
      };
    });

    let items = [];

    if (wearables.length > 0) {
      const wearables_stats = await this.getWalletWearablesStats(
        walletAddress,
        wearables.map(wearable => wearable.subject)
      );

      for (const wearable of wearables) {
        const wearable_metadata = this.wearable_metadata.get(wearable.subject);

        if (!wearable_metadata) {
          continue;
        }

        const wearableView: WearableView = {
          name: wearable_metadata[0],
          amount: formatZoneWei3(wearable.balance),
          picture_url: wearable_metadata[1]
        };

        const price = this.wearable_price.get(wearable.subject);
        if (price) {
          wearableView.price = formatZoneWei2(price);
        }

        const item_stats = wearables_stats.get(wearable.subject);
        if (item_stats && item_stats.profitAmountWei != BIG_INT_ZERO) {
          wearableView.price_diff_percentage = formatNumPercentage(item_stats.profitPercentage);
          wearableView.price_diff_positive = item_stats.isInProfit;
        }

        items.push(wearableView);
      }
    }


    const res: GetPortfolioReturn = {
      balance_summary: balance_summary_str,
      balance_usd: balance_usd_str,
      wallet_zone_balance: wallet_zone_balance_str,
      characters,
      items
    };

    if (usd_difference_str != undefined) {
      res.usd_balance_diff = usd_difference_str;
      res.usd_diff_percentage = usd_balance_diff_percentage_str;
      res.usd_balance_diff_positive = usd_balance_diff_positive;
    }

    return res;
  }

  // returns
  // current zone balance, nftIds, Wearable Balances
  // 24h before zone balance, nftIds, Wearables Balances
  async getWalletBalances(walletAddress: string) {

    const req: Promise<[bigint, bigint[], bigint[]]> = this.alienzone_view_helper_contract.walletBalancesCombined(walletAddress, this.wearable_subjects);
    const req_24h: Promise<[bigint, bigint[], bigint[]]> = this.alienzone_view_helper_contract.walletBalancesCombined(walletAddress, this.wearable_subjects, {
      blockTag: this.past_block
    });

    const [res, res24h] = await Promise.all([req, req_24h]);

    const wearables_balances_unfiltered = res[2];
    const wearable_balances_unfiltered_24h = res24h[2];

    const wearable_balances: WearableBalance[] = [];
    const wearables_balances_24h: WearableBalance[] = [];

    for (let i = 0; i < wearables_balances_unfiltered.length; i++) {
      const balance = wearables_balances_unfiltered[i];
      const balance_24h = wearable_balances_unfiltered_24h[i];
      const subject = this.wearable_subjects[i];

      if (balance > 0) {
        wearable_balances.push({ balance, subject });
      }

      if (balance_24h > 0) {
        wearables_balances_24h.push({ balance: balance_24h, subject });
      }
    }

    const wallet_balances: WalletBalances = {
      zone_balance: res[0],
      nftIds: res[1],
      wearables: wearable_balances
    };

    const wallet_balances_24h: WalletBalances = {
      zone_balance: res24h[0],
      nftIds: res24h[1],
      wearables: wearables_balances_24h
    };

    return { balances: wallet_balances, balances_24h: wallet_balances_24h };
  }

  async getWalletWearablesStats(walletAddress: string, userWearableSubjects: string[]): Promise<Map<string, CalcWearablesProfitReturn>> {
    let trades = await this.prisma.wearableTrade.findMany(
      {
        select: {
          subject: true,
          isBuy: true,
          wearableAmount: true,
          zoneAmountSummary: true
        },
        where: {
          AND: [
            {
              subject: {
                in: userWearableSubjects
              }
            },
            {
              traderWallet: walletAddress
            }
          ]
        },
        orderBy: [
          {
            blockNumber: "asc"
          },
          {
            logIndex: "asc"
          }
        ]
      }
    );

    if (trades.length == 0) {
      return new Map();
    }
    // subject, trades
    let trades_map = new Map<string, {
      subject: string;
      wearableAmount: string;
      isBuy: boolean;
      zoneAmountSummary: string
    }[]>;

    for (let trade of trades) {
      if (trades_map.has(trade.subject)) {
        const existingArray = trades_map.get(trade.subject);
        existingArray.push(trade);
      } else {
        trades_map.set(trade.subject, [trade]);
      }
    }

    const trades_stats: Map<string, CalcWearablesProfitReturn> = new Map();

    for (const [subject, trades] of trades_map) {
      let price = this.wearable_price.get(subject);
      if (!price) {
        continue;
      }

      const stats = calculateWearablesProfit(trades, price);
      if (stats.isEmptyPortfolio) {
        continue;
      }
      trades_stats.set(subject, stats);
    }

    return trades_stats;
  }

}

interface TokenPriceMatchaResponse {
  buyAmount: string;
  fees: {
    zeroExFee: {
      amount: string
    }
  };
}

interface WearableBalance {
  balance: bigint;
  subject: string;
}

interface WalletBalances {
  zone_balance: bigint;
  nftIds: bigint[];
  wearables: WearableBalance[];
}

const ZONE_DECIMALS: bigint = BigInt(18);
const USDT_DECIMALS: bigint = BigInt(6);
const PRICE_SCALE: bigint = BigInt(10) ** BigInt(6);
const one_eth = BigInt(10 ** 18)

export function calculateZonePriceInUSDT(
  zoneAmount: bigint,
  usdtAmount: bigint
): bigint {
  if (zoneAmount === BigInt(0)) {
    throw new Error("zoneAmount cannot be zero");
  }

  const decimalsDiff: bigint = ZONE_DECIMALS - USDT_DECIMALS;
  const tenPowerDecimalsDiff: bigint = BigInt(10) ** decimalsDiff;
  const usdtWithZoneDecimals: bigint = usdtAmount * tenPowerDecimalsDiff;

  return (usdtWithZoneDecimals * PRICE_SCALE) / zoneAmount
}

function calculateBalanceChange(
  balance_usdt_current: bigint,
  balance_usdt_24h: bigint
) {
  const absoluteDifference = balance_usdt_current - balance_usdt_24h;
  const isPositive = absoluteDifference >= BigInt(0);

  let percentage: number;

  if (balance_usdt_24h === BigInt(0)) {
    percentage = balance_usdt_current > BigInt(0) ? 100 : 0;
  } else {
    const percentageBigInt = (absoluteDifference * BigInt(10000)) / balance_usdt_24h;
    percentage = Number(percentageBigInt) / 100;
  }

  return {
    absolute: absoluteDifference,
    percentage,
    isPositive
  };
}

export function calcZoneBalanceInUsdt(
  zoneBalanceWei: bigint,
  zonePriceScaled: bigint
): bigint {
  if (zonePriceScaled === BigInt(0)) {
    return BigInt(0);
  }

  const usdtWithScale: bigint = zoneBalanceWei * zonePriceScaled;
  const usdtBeforeDecimals: bigint = usdtWithScale / PRICE_SCALE;

  const divisor: bigint = BigInt(10) ** (ZONE_DECIMALS - USDT_DECIMALS);
  const usdtBalance: bigint = usdtBeforeDecimals / divisor;

  return usdtBalance > BigInt(0) ? usdtBalance : BigInt(0);
}
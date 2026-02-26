// @ts-ignore
const WEI_DECIMALS = 18n;
// @ts-ignore
const ONE_UNIT_WEI = 10n ** WEI_DECIMALS;
const BIG_INT_ZERO = BigInt(0);

export interface CalcWearablesProfitReturn {
  isInProfit: boolean,
  profitAmountWei: bigint,
  currentValueWei: bigint,
  investedValueWei: bigint,
  profitPercentage: number,
  currentQuantityWei: bigint,
  isEmptyPortfolio: boolean,
}

export const calculateWearablesProfit = (
  transactions: {subject: string; wearableAmount: string; isBuy: boolean; zoneAmountSummary: string;}[],
  currentItemPriceWei: bigint
): CalcWearablesProfitReturn =>  {
  let totalInvested = BIG_INT_ZERO;
  let totalTokens = BIG_INT_ZERO;
  let portfolioWasReset = false;

  for (const tx of transactions) {
    const txAmount = BigInt(tx.wearableAmount);
    const txValue = BigInt(tx.zoneAmountSummary);

    if (tx.isBuy) {
      if (portfolioWasReset) {
        totalInvested = txValue;
        totalTokens = txAmount;
        portfolioWasReset = false;
      } else {
        totalInvested += txValue;
        totalTokens += txAmount;
      }
    } else {
      if (totalTokens === BIG_INT_ZERO) {
        continue;
      }

      const isCompleteSell = txAmount >= totalTokens;

      if (isCompleteSell) {
        totalInvested = BIG_INT_ZERO;
        totalTokens = BIG_INT_ZERO;
        portfolioWasReset = true;
      } else {
        let soldCost = BIG_INT_ZERO;

        if (totalTokens > BIG_INT_ZERO) {
          const soldCostRaw = totalInvested * txAmount;
          soldCost = soldCostRaw / totalTokens;

          const remainder = soldCostRaw % totalTokens;
          if (remainder > BIG_INT_ZERO) {
            // @ts-ignore
            soldCost += 1n;
          }
        }
        totalInvested -= soldCost;
        totalTokens -= txAmount;
      }
    }
  }

  const isEmptyPortfolio = totalTokens === BIG_INT_ZERO;

  if (isEmptyPortfolio) {
    return {
      isInProfit: false,
      profitAmountWei: BIG_INT_ZERO,
      currentValueWei: BIG_INT_ZERO,
      investedValueWei: BIG_INT_ZERO,
      profitPercentage: 0,
      currentQuantityWei: BIG_INT_ZERO,
      isEmptyPortfolio: false,
    };
  }

  // let averagePrice = BIG_INT_ZERO;
  // if (totalTokens > BIG_INT_ZERO) {
  //   averagePrice = (totalInvested * ONE_UNIT_WEI) / totalTokens;
  // }

  const currentPortfolioValue = (currentItemPriceWei * totalTokens) / ONE_UNIT_WEI;

  const profitAmount = currentPortfolioValue - totalInvested;
  const isInProfit = profitAmount > BIG_INT_ZERO;

  // @ts-ignore
  const percentage = totalInvested > 0n ?
    // @ts-ignore
    Number((profitAmount * ONE_UNIT_WEI * 100n) / totalInvested) / Number(ONE_UNIT_WEI) : 0;


  return {
    isInProfit,
    profitAmountWei: profitAmount,
    currentValueWei: currentPortfolioValue,
    investedValueWei: totalInvested,
    profitPercentage: percentage,
    currentQuantityWei: totalTokens,
    isEmptyPortfolio: false,
  };
};


// const transactions: any[] = [
//   {
//     isBuy: true,
//     wearableAmount: "1000000000000000000", // 1.0 шт
//     zoneAmountSummary: "1000000000000000000000" // 1000 зонов
//   },
//   {
//     isBuy: true,
//     wearableAmount: "300000000000000000", // 0.3 шт
//     zoneAmountSummary: "450000000000000000000" // 450 зонов
//   },
//   {
//     isBuy: false,
//     wearableAmount: "1300000000000000000", // 1 шт
//     zoneAmountSummary: "450000000000000000000" // 450 зонов
//   },
//   //
//   {
//     isBuy: true,
//     wearableAmount: "1000000000000000000", // 1 шт
//     zoneAmountSummary: "2500000000000000000000" // 500 зонов
//   }
// ];
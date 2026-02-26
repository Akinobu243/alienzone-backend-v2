if (typeof global.AbortController === 'undefined') {
  // @ts-ignore
  global.AbortController = class {
    signal = { aborted: false };
    abort() { this.signal.aborted = true; }
  };
}


// describe("portfolio service", () => {
//
//   test("quote eth-usdt", async () => {
//     const provider = new ethers.JsonRpcProvider(
//       ""
//     );
//
//     const quoter_v2 = new ethers.Contract(
//       "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
//       UNISWAP_V2_ROUTER_ABI,
//       provider
//     );
//
//     const token_amount_in = BigInt("10000000000000000000000")
//
//     let res = await quoter_v2.getAmountsOut.staticCall(
//       token_amount_in,
//       [
//         ZONE_TOKEN_ARBITRUM,
//         WETH_ARBITRUM
//       ]
//     );
//
//     let amount_out_weth = res[1];
//
//     console.log(amount_out_weth)
//
//     const quoter_v3 = new ethers.Contract(
//       "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
//       UniswapV3QuoterV2Abi,
//       provider
//     );
//
//     let quote_params = {
//       tokenIn: WETH_ARBITRUM,
//       tokenOut: USDT_ARBITRUM,
//       fee: 3000,
//       amountIn: amount_out_weth,
//       sqrtPriceLimitX96: "0"
//     };
//
//     let res_usdt = await quoter_v3.quoteExactInputSingle.staticCall(
//       quote_params
//     )
//
//     // 63304097
//
//
//     const [amountOut, sqrtPriceX96After, initializedTicksCrossed, gasEstimate] = res_usdt;
//
//     console.log(amountOut.toString());
//     // const price_for_one_token = calculateZonePriceInUSDT(token_amount_in, amountOut);
//     // console.log(price_for_one_token.toString());
//     //
//     // const zone_balance = BigInt("100000000000000000")
//     // const balance_usdt_cost = calcZoneBalanceInUsdt(zone_balance, price_for_one_token);
//     // console.log(balance_usdt_cost.toString())
//
//     // 2692.636426
//   });
//
//   test("quote zone-usdt", async () => {
//     const provider = new ethers.JsonRpcProvider(
//       ""
//     );
//
//     const quoter = new ethers.Contract(
//       "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
//       UniswapV3QuoterV2Abi,
//       provider
//     );
//
//     const token_amount_in = BigInt("20000000000000000000")
//     const quote_params = {
//       tokenIn: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
//       tokenOut: "0x888AAA48EbEa87C74f690189E947d2C679705972",
//       fee: 3000,
//       amountIn:token_amount_in,
//       sqrtPriceLimitX96: "0"
//     };
//
//     const amount_out = await quoter.quoteExactInputSingle.staticCall(
//       quote_params,
//       {
//         blockTag: 24313374
//       }
//     )
//
//     const [amountOut, sqrtPriceX96After, initializedTicksCrossed, gasEstimate] = amount_out;
//
//     console.log(amountOut.toString());
//     const price_for_one_token = calculateZonePriceInUSDT(token_amount_in, amountOut);
//     console.log(price_for_one_token.toString());
//
//     const zone_balance = BigInt("100000000000000000")
//     const balance_usdt_cost = calcZoneBalanceInUsdt(zone_balance, price_for_one_token);
//     console.log(balance_usdt_cost.toString())
//
//     // 2692.636426
//   });
// });


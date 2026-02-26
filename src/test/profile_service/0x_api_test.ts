import axios from "axios";

interface TokenPriceResponse {
  price: string;
  buyToken: string;
  sellToken: string;
}

interface MatchaQuoteParams {
  buyToken: string;
  sellToken: string;
  sellAmount?: string;
  buyAmount?: string;
  takerAddress?: string;
  slippagePercentage?: string;
  feeRecipient?: string;
  buyTokenPercentageFee?: string;
  affiliateAddress?: string;
}


async function test() {
  const baseUrl = 'https://api.0x.org/swap/allowance-holder/price';

  const buy_token = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
  const sell_token = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"
  const sell_amount = "10000000000000000000000"

  const params: MatchaQuoteParams = {
    buyToken: buy_token,
    sellToken: sell_token,
    sellAmount: sell_amount,
    takerAddress: '0x0000000000000000000000000000000000000000',
    slippagePercentage: '0.01', // 1%
  };

  const response = await axios.get<TokenPriceResponse>(baseUrl, {
    params,
    headers: {
      '0x-api-key': "e0cedd18-49c5-4c8f-889c-b08839f5e05b",
      '0x-version': 'v2'
    } });

  console.log(response)
}

test();
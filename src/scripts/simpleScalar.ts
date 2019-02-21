import { IMarketMakerParams, cancelOpenOrders } from "../MarketMaker";
import { Market } from "veil-js";

// Return last price from market's data feed
const getSpotPrice = async (veil: any, market: Market) => {
  const feed = await veil.getDataFeed(market.index);
  return feed.entries[feed.entries.length - 1].value;
};

export default async (params: IMarketMakerParams) => {
  const { market, veil, spread, orderAmount } = params;
  const midPrice = await getSpotPrice(veil, market);
  const [minPrice, maxPrice] = veil.getScalarRange(market);
  const ethPrice = (midPrice - minPrice) / (maxPrice - minPrice);
  const halfSpread = spread / 2;
  const adjustedEthPrice = Math.max(
    0.01 + halfSpread,
    Math.min(ethPrice, 0.99 - halfSpread)
  );
  const bidPrice = adjustedEthPrice - halfSpread;
  const askPrice = adjustedEthPrice + halfSpread;

  // Cancel all pending orders in this market
  await cancelOpenOrders(veil, market);

  // Create long order
  const longQuote = await veil.createQuote(
    market,
    "buy",
    "long",
    orderAmount,
    bidPrice
  );
  const longOrder = await veil.createOrder(longQuote, { postOnly: true });
  console.log("Created long order", longOrder);

  // Create short order
  const shortQuote = await veil.createQuote(
    market,
    "buy",
    "short",
    orderAmount,
    1 - askPrice
  );
  const shortOrder = await veil.createOrder(shortQuote, { postOnly: true });
  console.log("Created short order", shortOrder);
};

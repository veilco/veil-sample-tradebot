import { IMarketMakerParams, cancelOpenOrders } from "../MarketMaker";

export default async (params: IMarketMakerParams) => {
  const { market, veil, spread, orderAmount } = params;
  const midPrice = 0.5; // NOTE: change this code to set your own price
  const halfSpread = spread / 2;
  const bidPrice = midPrice - halfSpread;
  const askPrice = midPrice + halfSpread;

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

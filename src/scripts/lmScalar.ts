import { IMarketMakerParams, cancelOpenOrders } from "../MarketMaker";
import { Market, DataFeedEntry } from "veil-js";
import { BigNumber } from "bignumber.js";
const ss = require("simple-statistics");

const TEN_18 = new BigNumber(10).pow(18);

// Clamp a number between two bounds
function clamp(num: number, lowerBound: number, upperBound: number) {
  return Math.max(lowerBound, Math.min(num, upperBound));
}

const getLinearProjection = async (veil: any, market: Market) => {
  const feed = await veil.getDataFeed(market.index, "day");
  const normalizedEntries = feed.entries
    .sort((a: DataFeedEntry, b: DataFeedEntry) => a.timestamp - b.timestamp)
    .map((entry: DataFeedEntry) => [entry.timestamp, parseFloat(entry.value)]);
  const lmFunc = ss.linearRegressionLine(
    ss.linearRegression(normalizedEntries)
  );
  const projected = lmFunc(market.endsAt);
  console.log("Projection for", new Date(market.endsAt), projected);
  return projected;
};

// With a large net LONG position, you should skew the mid price down (so that you
// spend less on LONGs).
// With a large net SHORT position (a negative position), you should skew the mid
// price up (so that you spend less on SHORTs).
// Skew returns 0 at 0, 1 at -Infinity, and -1 at Infinity
// At 1, it returns -0.18 (midPrice will decrease by ~18% when you hold a net position of 1)
// At 10, it returns -0.86 (midPrice will decrease by ~86% when you hold a net position of 10)
function positionToSkew(position: number) {
  const sign = position > 0 ? -1 : 1;
  return sign * (1 - Math.exp(-Math.abs(position / 5)));
}

export default async (params: IMarketMakerParams) => {
  const { market, veil, spread, orderAmount } = params;
  const midPrice = await getLinearProjection(veil, market);
  const [minPrice, maxPrice] = veil.getScalarRange(market);
  const ethPrice = (midPrice - minPrice) / (maxPrice - minPrice);
  const halfSpread = spread / 2;
  const adjustedEthPrice = clamp(
    ethPrice,
    0.01 + halfSpread,
    0.99 - halfSpread
  );

  if (!process.env.ETHEREUM_HTTP)
    throw new Error(
      "ETHEREUM_HTTP environment variable required to fetch balances"
    );

  // Get balances
  const { longBalanceClean, shortBalanceClean } = await veil.getMarketBalances(
    market
  );
  const longBalance = new BigNumber(longBalanceClean).div(TEN_18).toNumber();
  const shortBalance = new BigNumber(shortBalanceClean).div(TEN_18).toNumber();

  const netPosition = (longBalance - shortBalance) / orderAmount;
  const skew = positionToSkew(netPosition) * halfSpread;

  const bidPrice = adjustedEthPrice + skew - halfSpread;
  const askPrice = adjustedEthPrice + skew + halfSpread;
  const shouldCreateBid = bidPrice < 0.9; // Configurable
  const shouldCreateAsk = askPrice > 0.1; // Configurable
  const bidType = shortBalance > orderAmount ? "sellShort" : "buyLong";
  const askType = longBalance > orderAmount ? "sellLong" : "buyShort";

  console.log("Balances: LONG", longBalance, "   SHORT", shortBalance);
  console.log("Skew: " + skew);
  console.log(
    !shouldCreateBid ? "[SKIP]" : "      ",
    "Creating bid at " + bidPrice,
    bidType === "sellShort" ? "[sell short]" : "[buy long]"
  );
  console.log(
    !shouldCreateAsk ? "[SKIP]" : "      ",
    "Creating ask at " + askPrice,
    askType === "sellLong" ? "[sell long]" : "[buy short]"
  );

  await cancelOpenOrders(veil, market);

  if (shouldCreateBid) {
    const bidQuote = await veil.createQuote(
      market,
      bidType === "sellShort" ? "sell" : "buy",
      bidType === "sellShort" ? "short" : "long",
      orderAmount,
      bidType === "sellShort" ? 1 - bidPrice : bidPrice
    );
    const bidOrder = await veil.createOrder(bidQuote, { postOnly: true });
    console.log("Created bid order", bidOrder);
  }

  if (shouldCreateAsk) {
    const askQuote = await veil.createQuote(
      market,
      askType === "sellLong" ? "sell" : "buy",
      askType === "sellLong" ? "long" : "short",
      orderAmount,
      askType === "sellLong" ? askPrice : 1 - askPrice
    );
    const askOrder = await veil.createOrder(askQuote, { postOnly: true });
    console.log("Created ask order", askOrder);
  }
};

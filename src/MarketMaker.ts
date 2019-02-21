import Veil, { Market } from "veil-js";

export interface IMarketMakerParams {
  market: Market;
  veil: any;
  spread: number;
  orderAmount: number;
}

export const cancelOpenOrders = async (veil: Veil, market: Market) => {
  const userOrders = await veil.getUserOrders(market);
  let cancelCount = 0;
  for (let order of userOrders.results) {
    if (order.status === "open") {
      await veil.cancelOrder(order.uid);
      cancelCount += 1;
    }
  }
  console.log(`Cancelled ${cancelCount} open orders`);
};

export default class MarketMaker {
  spread: number;
  orderAmount: number;
  veil: Veil;

  constructor(veil: Veil, spread: number = 0.05, orderAmount: number = 1) {
    this.veil = veil;
    this.spread = spread;
    this.orderAmount = orderAmount;
  }

  get marketMakerParams() {
    return {
      veil: this.veil,
      orderAmount: this.orderAmount,
      spread: this.spread
    };
  }

  async start(marketSlug: string, marketMakeFunc: Function) {
    console.log("Starting market maker on market " + marketSlug);
    const market = await this.veil.getMarket(marketSlug);
    const run = async () => {
      while (true) {
        try {
          await marketMakeFunc({ market, ...this.marketMakerParams });
          break;
        } catch (e) {
          console.error(e);
          // Sleep 1 second
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      console.log("Waiting five minutes to market make again...");
      setTimeout(run, 1000 * 60 * 5);
    };

    run();
  }
}

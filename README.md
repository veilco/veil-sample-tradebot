# 🤖 Sample Veil Tradebot
A sample tradebot for market making on [Veil](https://veil.co).

>⚠️ Disclaimer: This tradebot is for demonstration purposes only. We do not recommend running it in production without changing the trade logic. These strategies are intentionally naive for educational purposes.

## Getting Started
Download the code and then run:
```
yarn install
yarn build
```
[Download Yarn](https://yarnpkg.com/en/) if you do not already have it.

Then add a file called `.env` to the root of the directory with these entries:
```
MNEMONIC="apple glue ..."
ADDRESS="0x..."
ETHEREUM_HTTP="https://kovan.infura.io" // or https://mainnet.infura.io
API_URL="https://api.kovan.veil.co" // or https://api.veil.co
```

## Background reading
These scripts make heavy use of [Veil's API](https://github.com/veilco/veil-api-docs) and [Veil.js](https://github.com/veilco/veil-js), Veil's Typescript library. We also recommend reading our [Guide to Augur Economics](https://medium.com/veil-blog/a-guide-to-augur-market-economics-16c66d956b6c), which includes details about pricing and payouts of binary and scalar markets.

## Run simple scalar tradebot
```
node dist/index.js simple-scalar <market slug> --spread 0.05 --amount 1
```
You can find a market's slug from [Veil's API](https://github.com/veilco/veil-api-docs) or by looking at a [market's URL](https://app.veil.co/market/rep-usd-2019-02-02-5x). Example: `rep-usd-2019-02-02-5x`.

The `simple-scalar` command has two options:
* `-s, --spread <spread>`  Specify the desired spread between 0 and 1. The default is `0.06` (or 6%).
* `-a, --amount <amount>` Specify the desired order amount of shares. The default is `0.5`.

The `simple-scalar` tradebot looks up the current spot price from the market's data feed and makes orders at the specified spread around that price. [Review the simple-scalar code](https://github.com/veilco/veil-sample-tradebot/blob/master/src/scripts/simpleScalar.ts).

## Run simple binary tradebot
```
node dist/index.js simple-binary <market slug> --spread 0.1 --amount 2
```
The `simple-binary` command has the same two options as `sample-scalar`. See above.

The `simple-binary` tradebot makes orders at the specified spread around a hard-coded price. [Review the simple-binary code](https://github.com/veilco/veil-sample-tradebot/blob/master/src/scripts/simpleBinary.ts).

## Run many market makers at once
```
node dist/index.js bulk --spread 0.06 --amount 0.5
```
The `bulk` command pulls all open markets from Veil's API and attempts to market make in them all based on their type (i.e. `yesno` or `scalar`). [Review the code](https://github.com/veilco/veil-sample-tradebot/blob/master/src/BulkMarketMaker.ts).

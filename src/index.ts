#!/usr/bin/env node
require("dotenv").config();

import Veil from "veil-js";
import * as program from "commander";
import MarketMaker from "./MarketMaker";
import BulkMarketMaker from "./BulkMarketMaker";

import simpleScalar from "./scripts/simpleScalar";
import simpleBinary from "./scripts/simpleBinary";

process.on("unhandledRejection", err => {
  console.error(err);
  process.exit(1);
});

const botProgram = (commandString: string) => {
  return program
    .command(commandString)
    .option("-s, --spread <spread>", "Add the spread (0-1)", parseFloat, 0.06)
    .option(
      "-a, --amount <amount>",
      "Add the order amount (ETH)",
      parseFloat,
      0.5
    );
};

const initMarketMaker = (cmd: { spread: number; amount: number }) => {
  const veil = new Veil(
    process.env.MNEMONIC, // "apple horse ..."
    process.env.ADDRESS, // "0xabc..."
    process.env.API_URL // "https://api.veil.co"
  );
  return new MarketMaker(veil, cmd.spread, cmd.amount);
};

botProgram("simple-binary <market>").action(async (market: string, cmd) => {
  const marketMaker = initMarketMaker(cmd);
  await marketMaker.start(market, simpleBinary);
});

botProgram("simple-scalar <market>").action(async (market: string, cmd) => {
  const marketMaker = initMarketMaker(cmd);
  await marketMaker.start(market, simpleScalar);
});

botProgram("bulk").action(async cmd => {
  const veil = new Veil(
    process.env.MNEMONIC,
    process.env.ADDRESS,
    process.env.API_URL
  );
  const marketMaker = new BulkMarketMaker(veil, cmd.spread, cmd.amount);
  await marketMaker.start();
});

program.parse(process.argv);

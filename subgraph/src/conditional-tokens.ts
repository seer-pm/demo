import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  ConditionResolution,
  PayoutRedemption,
  PositionSplit,
  PositionsMerge,
} from "../generated/ConditionalTokens/ConditionalTokens";
import { Condition, ConditionalEvent, Market } from "../generated/schema";

function createConditionalEvent(
  marketId: string,
  accountId: Address,
  type: string,
  amount: BigInt,
  blockNumber: BigInt,
  collateral: Address,
  transactionHash: Bytes,
  logIndex: BigInt,
): void {
  const conditionalEvent = new ConditionalEvent(transactionHash.concatI32(logIndex.toI32()));
  conditionalEvent.market = marketId;
  conditionalEvent.accountId = accountId;
  conditionalEvent.type = type;
  conditionalEvent.amount = amount;
  conditionalEvent.blockNumber = blockNumber;
  conditionalEvent.collateral = collateral;
  conditionalEvent.transactionHash = transactionHash;
  conditionalEvent.save();
}

const splitMethods = ["0x50d9991c", "0x59a89d8b", "0xd5f82280"];

const mergeMethods = ["0xd6d150d1", "0x4c95d98d", "0x7abef8d1"];

const redeemMethods = ["0x9fe603e8", "0xb6fefc75", "0x865955a0"];

export function handlePositionSplit(evt: PositionSplit): void {
  const condition = Condition.load(evt.params.conditionId.toHexString());

  if (condition === null) {
    return;
  }

  let markets = condition.markets.load();
  for (let i = 0; i < markets.length; i++) {
    let market = markets[i];
    if (market.parentCollectionId.equals(evt.params.parentCollectionId)) {
      market.outcomesSupply = market.outcomesSupply.plus(evt.params.amount);
      market.save();
    }
  }

  const methodId = Bytes.fromUint8Array(evt.transaction.input.slice(0, 4)).toHexString();

  if (!splitMethods.includes(methodId)) {
    return;
  }

  const decodedMarket = ethereum.decode("address", Bytes.fromUint8Array(evt.transaction.input.slice(4, 36)));

  if (!decodedMarket) {
    return;
  }

  const market = Market.load(decodedMarket.toAddress().toHexString());
  if (!market) {
    return;
  }

  createConditionalEvent(
    market.id,
    evt.transaction.from,
    "split",
    evt.params.amount,
    evt.block.number,
    evt.params.collateralToken,
    evt.transaction.hash,
    evt.logIndex,
  );
}

export function handlePositionsMerge(evt: PositionsMerge): void {
  const condition = Condition.load(evt.params.conditionId.toHexString());

  if (condition === null) {
    return;
  }

  let markets = condition.markets.load();
  for (let i = 0; i < markets.length; i++) {
    let market = markets[i];
    if (market.parentCollectionId.equals(evt.params.parentCollectionId)) {
      market.outcomesSupply = market.outcomesSupply.minus(evt.params.amount);
      market.save();
    }
  }

  const methodId = Bytes.fromUint8Array(evt.transaction.input.slice(0, 4)).toHexString();

  if (!mergeMethods.includes(methodId)) {
    return;
  }

  const decodedMarket = ethereum.decode("address", Bytes.fromUint8Array(evt.transaction.input.slice(4, 36)));

  if (!decodedMarket) {
    return;
  }

  const market = Market.load(decodedMarket.toAddress().toHexString());
  if (!market) {
    return;
  }

  createConditionalEvent(
    market.id,
    evt.transaction.from,
    "merge",
    evt.params.amount,
    evt.block.number,
    evt.params.collateralToken,
    evt.transaction.hash,
    evt.logIndex,
  );
}

export function handlePayoutRedemption(evt: PayoutRedemption): void {
  const condition = Condition.load(evt.params.conditionId.toHexString());

  if (condition === null) {
    return;
  }

  let markets = condition.markets.load();
  for (let i = 0; i < markets.length; i++) {
    let market = markets[i];
    if (market.parentCollectionId.equals(evt.params.parentCollectionId)) {
      market.outcomesSupply = market.outcomesSupply.minus(evt.params.payout);
      market.save();
    }
  }

  const methodId = Bytes.fromUint8Array(evt.transaction.input.slice(0, 4)).toHexString();

  if (!redeemMethods.includes(methodId)) {
    return;
  }

  const decodedMarket = ethereum.decode("address", Bytes.fromUint8Array(evt.transaction.input.slice(4, 36)));

  if (!decodedMarket) {
    return;
  }

  const market = Market.load(decodedMarket.toAddress().toHexString());
  if (!market) {
    return;
  }

  createConditionalEvent(
    market.id,
    evt.transaction.from,
    "redeem",
    evt.params.payout,
    evt.block.number,
    evt.params.collateralToken,
    evt.transaction.hash,
    evt.logIndex,
  );
}

export function handleConditionResolution(evt: ConditionResolution): void {
  const condition = Condition.load(evt.params.conditionId.toHexString());
  if (condition === null) {
    return;
  }

  condition.markets.load().forEach((market) => {
    market.payoutReported = true;
    market.save();
  });
}

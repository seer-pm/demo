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

class MethodSignature {
  name: string;
  signature: string;
  marketParamPos: i32;
}

const splitMethods: MethodSignature[] = [
  {
    name: "splitFromBase",
    signature: "0x50d9991c",
    marketParamPos: 0,
  },
  {
    name: "splitFromDai",
    signature: "0x59a89d8b",
    marketParamPos: 0,
  },
  {
    name: "splitPosition",
    signature: "0xd5f82280",
    marketParamPos: 1,
  },
];

const mergeMethods: MethodSignature[] = [
  {
    name: "mergeToBase",
    signature: "0xd6d150d1",
    marketParamPos: 0,
  },
  {
    name: "mergeToDai",
    signature: "0x4c95d98d",
    marketParamPos: 0,
  },
  {
    name: "mergePositions",
    signature: "0x7abef8d1",
    marketParamPos: 1,
  },
];

const redeemMethods: MethodSignature[] = [
  {
    name: "redeemToBase",
    signature: "0x9fe603e8",
    marketParamPos: 0,
  },
  {
    name: "redeemToDai",
    signature: "0xb6fefc75",
    marketParamPos: 0,
  },
  {
    name: "redeemPositions",
    signature: "0x865955a0",
    marketParamPos: 1,
  },
];

function getMethodSignature(methods: MethodSignature[], methodId: string): MethodSignature | null {
  for(let i = 0; i < methods.length; i++) {
    if (methods[i].signature == methodId) {
      return methods[i]
    }
  }
  return null;
}

function getMarketFromTx(
  txInput: Bytes,
  methods: MethodSignature[],
): Market | null {
  const methodId = Bytes.fromUint8Array(txInput.slice(0, 4)).toHexString();
  const matchingMethod = getMethodSignature(methods, methodId);
  if (!matchingMethod) {
    return null;
  }
  const startIndex: i32 = matchingMethod.marketParamPos * 32 + 4;
  const decodedMarket = ethereum.decode("address", Bytes.fromUint8Array(txInput.slice(startIndex, startIndex + 32)));
  if (!decodedMarket) {
    return null;
  }

  const market = Market.load(decodedMarket.toAddress().toHexString());
  if (!market) {
    return null;
  }

  return market;
}

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

  const market = getMarketFromTx(evt.transaction.input, splitMethods);

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

  const market = getMarketFromTx(evt.transaction.input, mergeMethods);

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

  const market = getMarketFromTx(evt.transaction.input, redeemMethods);

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

  const markets = condition.markets.load();
  for(let i = 0; i < markets.length; i++) {
    markets[i].payoutReported = true;
    markets[i].payoutNumerators = evt.params.payoutNumerators;
    markets[i].save();
  }
}

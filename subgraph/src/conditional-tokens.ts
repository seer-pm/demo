import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  ConditionResolution,
  PositionSplit,
  PositionsMerge,
  PayoutRedemption,
} from "../generated/ConditionalTokens/ConditionalTokens";
import { Condition, ConditionalEvent } from "../generated/schema";

function createConditionalEvent(
  marketId: string,
  accountId: Address,
  type: string,
  amount: BigInt,
  blockNumber: BigInt,
  collateral: Address,
  transactionHash: Bytes,
  logIndex: BigInt
): void {
  const conditionalEvent = new ConditionalEvent(
    transactionHash.concatI32(logIndex.toI32())
  );
  conditionalEvent.market = marketId;
  conditionalEvent.accountId = accountId;
  conditionalEvent.type = type;
  conditionalEvent.amount = amount;
  conditionalEvent.blockNumber = blockNumber;
  conditionalEvent.collateral = collateral;
  conditionalEvent.transactionHash = transactionHash;
  conditionalEvent.save();
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
    createConditionalEvent(
      market.id,
      evt.transaction.from,
      "split",
      evt.params.amount,
      evt.block.number,
      evt.params.collateralToken,
      evt.transaction.hash,
      evt.logIndex
    );
  }
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
      createConditionalEvent(
        market.id,
        evt.transaction.from,
        "merge",
        evt.params.amount,
        evt.block.number,
        evt.params.collateralToken,
        evt.transaction.hash,
        evt.logIndex
      );
    }
  }
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
      createConditionalEvent(
        market.id,
        evt.transaction.from,
        "redeem",
        evt.params.payout,
        evt.block.number,
        evt.params.collateralToken,
        evt.transaction.hash,
        evt.logIndex
      );
    }
  }
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

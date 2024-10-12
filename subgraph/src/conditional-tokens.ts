import {
  ConditionResolution,
  PositionSplit,
  PositionsMerge,
  PayoutRedemption,
} from "../generated/ConditionalTokens/ConditionalTokens";
import { Condition } from "../generated/schema";

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

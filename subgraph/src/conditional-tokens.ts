import {
  ConditionResolution,
  PositionSplit,
  PositionsMerge,
} from "../generated/ConditionalTokens/ConditionalTokens";
import { Condition, Market } from "../generated/schema";

export function handlePositionSplit(evt: PositionSplit): void {
  const condition = Condition.load(evt.params.conditionId.toHexString());
  if (condition === null) {
    return;
  }

  const market = Market.load(condition.market)!;
  market.outcomesSupply = market.outcomesSupply.plus(evt.params.amount);
  market.save();
}

export function handlePositionMerge(evt: PositionsMerge): void {
  const condition = Condition.load(evt.params.conditionId.toHexString());
  if (condition === null) {
    return;
  }

  const market = Market.load(condition.market)!;
  market.outcomesSupply = market.outcomesSupply.minus(evt.params.amount);
  market.save();
}

export function handleConditionResolution(evt: ConditionResolution): void {
  const condition = Condition.load(evt.params.conditionId.toHexString());
  if (condition === null) {
    return;
  }

  const market = Market.load(condition.market)!;
  market.payoutReported = true;
  market.save();
}
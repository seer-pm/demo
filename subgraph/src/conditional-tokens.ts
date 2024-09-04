import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  ConditionResolution,
  TransferSingle,
  TransferBatch,
} from "../generated/ConditionalTokens/ConditionalTokens";
import { Condition, Position, Market } from "../generated/schema";

function processTransfer(
  positionId: string,
  from: Address,
  to: Address,
  value: BigInt
): void {
  if (from.notEqual(Address.zero()) && to.notEqual(Address.zero())) {
    return;
  }

  const position = Position.load(positionId);
  if (position === null) {
    return;
  }

  // minting or burning
  const market = Market.load(position.market)!;
  market.outcomesSupply = to.equals(Address.zero())
    ? market.outcomesSupply.minus(value)
    : market.outcomesSupply.plus(value);
  market.save();
}

export function handleTransferSingle(evt: TransferSingle): void {
  processTransfer(
    evt.params.id.toHexString(),
    evt.params.from,
    evt.params.to,
    evt.params.value
  );
}

export function handleTransferBatch(evt: TransferBatch): void {
  for (let i = 0; i < evt.params.ids.length; i++) {
    processTransfer(
      evt.params.ids[i].toHexString(),
      evt.params.from,
      evt.params.to,
      evt.params.values[i]
    );
  }
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

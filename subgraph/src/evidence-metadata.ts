import { BigInt, Address } from "@graphprotocol/graph-ts";
import { MetaEvidence as MetaEvidenceEvent } from "../generated/LightGeneralizedTCR/IEvidence";
import { CurateMetadata, ArbitratorMetadata } from "../generated/schema";

function getOrCreateCurateMetadata(address: Address): CurateMetadata {
  let registry = CurateMetadata.load(address);
  if (registry === null) {
    registry = new CurateMetadata(address);
    registry.registrationMetaEvidenceURI = "";
    registry.clearingMetaEvidenceURI = "";
    registry.metaEvidenceCount = BigInt.zero();
    registry.save();
  }
  return registry;
}

export function handleCurateMetaEvidence(evt: MetaEvidenceEvent): void {
  let metaEvidence = getOrCreateCurateMetadata(evt.address);

  metaEvidence.metaEvidenceCount = metaEvidence.metaEvidenceCount.plus(
    BigInt.fromI32(1)
  );

  if (
    metaEvidence.metaEvidenceCount
      .mod(BigInt.fromI32(2))
      .equals(BigInt.fromI32(1))
  ) {
    metaEvidence.registrationMetaEvidenceURI = evt.params._evidence;
  } else {
    metaEvidence.clearingMetaEvidenceURI = evt.params._evidence;
  }

  metaEvidence.save();
}

function getOrCreateArbitratorMetadata(address: Address): ArbitratorMetadata {
  let metaEvidence = ArbitratorMetadata.load(address);
  if (metaEvidence === null) {
    metaEvidence = new ArbitratorMetadata(address);
    metaEvidence.registrationMetaEvidenceURI = "";
    metaEvidence.save();
  }
  return metaEvidence;
}

export function handleArbitratorMetaEvidence(evt: MetaEvidenceEvent): void {
  let metaEvidence = getOrCreateArbitratorMetadata(evt.address);

  metaEvidence.registrationMetaEvidenceURI = evt.params._evidence;

  metaEvidence.save();
}

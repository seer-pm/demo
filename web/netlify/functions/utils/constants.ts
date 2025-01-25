import { Address } from "viem";
import { SupportedChain } from "../../../src/lib/chains";

export const S_DAI_ADAPTER = "0xD499b51fcFc66bd31248ef4b28d656d67E591A94";

export const liquidityManagerAddressMapping: Partial<Record<SupportedChain, Address>> = {
  100: "0x031778c7A1c08787aba7a2e0B5149fEb5DECabD7",
};

export const FROM_EMAIL = "gen@seer.pm";

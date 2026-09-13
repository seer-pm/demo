import { Hex, concatHex, encodeAbiParameters, getAddress, keccak256, pad, toHex } from "viem";

/** Arachnid CREATE2 Deployer Proxy — same address on supported EVM chains. */
export const CREATE2_DEPLOYER = "0x4e59b44847b379578588920cA78FbF26c0B4956C" as const;

/**
 * Permissions LimitOrderHook declares in `getHookPermissions`: AFTER_INITIALIZE (1<<12) | AFTER_SWAP (1<<6).
 * Uniswap V4 reads them from the low 14 bits of the hook address, so the deploy salt has to be mined.
 */
export const HOOK_FLAGS = 0x1040n;
export const FLAG_MASK = 0x3fffn;
const MAX_LOOP = 160_444;

/** Uniswap V4 PoolManager per chain (constructor argument of the hook). */
export const POOL_MANAGER: Record<number, `0x${string}`> = {
  1: "0x000000000004444c5dc75cB358380D2e3dE08A90",
  10: "0x9a13f98cb987694c9f086b1f5eb990eea8264ec3",
  8453: "0x498581ff718922c3f8e6a244956af099b2652b2b",
};

export function hasHookFlags(address: string): boolean {
  return (BigInt(address) & FLAG_MASK) === HOOK_FLAGS;
}

export function computeCreate2Address(deployer: `0x${string}`, salt: Hex, initCodeHash: Hex): `0x${string}` {
  return getAddress(`0x${keccak256(concatHex(["0xff", deployer, salt, initCodeHash])).slice(-40)}`);
}

export function encodeHookConstructorArgs(poolManager: `0x${string}`): Hex {
  return encodeAbiParameters([{ type: "address" }], [poolManager]);
}

/**
 * Mine a CREATE2 salt so the hook address encodes `HOOK_FLAGS` in its low 14 bits.
 * Salts are tried in order from 0, so the result is deterministic for a given init code.
 */
export function mineHookSalt(
  creationCode: Hex,
  constructorArgs: Hex,
  deployer: `0x${string}` = CREATE2_DEPLOYER,
): { hookAddress: `0x${string}`; salt: Hex } {
  const initCode = concatHex([creationCode, constructorArgs]);
  const initCodeHash = keccak256(initCode);

  for (let i = 0; i < MAX_LOOP; i++) {
    const salt = pad(toHex(i), { size: 32 });
    const hookAddress = computeCreate2Address(deployer, salt, initCodeHash);
    if (hasHookFlags(hookAddress)) {
      return { hookAddress, salt };
    }
  }

  throw new Error("HookMiner: could not find salt");
}

import { expect } from "chai";
import { readFileSync } from "fs";
import { artifacts, ethers, network } from "hardhat";
import path from "path";
import { Hex, concatHex, keccak256 } from "viem";
import {
  CREATE2_DEPLOYER,
  HOOK_FLAGS,
  POOL_MANAGER,
  computeCreate2Address,
  encodeHookConstructorArgs,
  hasHookFlags,
  mineHookSalt,
} from "../../scripts/hook-miner";

const LIMIT_ORDER_HOOK_FQN = "@openzeppelin/uniswap-hooks/src/general/LimitOrderHook.sol:LimitOrderHook";

/** Runtime code of the Arachnid CREATE2 proxy (`eth_getCode(CREATE2_DEPLOYER)` on any chain). */
const CREATE2_PROXY_RUNTIME_CODE =
  "0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3";

const DEPLOYED_CHAINS: { chainId: number; network: string }[] = [
  { chainId: 1, network: "ethereum" },
  { chainId: 10, network: "optimism" },
  { chainId: 8453, network: "base" },
];

describe("LimitOrderHook deploy", function () {
  describe("hook-miner", function () {
    it("computeCreate2Address matches the EIP-1014 example", function () {
      // https://eips.ethereum.org/EIPS/eip-1014, example 5
      const address = computeCreate2Address(
        "0x00000000000000000000000000000000deadbeef",
        "0x00000000000000000000000000000000000000000000000000000000cafebabe",
        keccak256("0xdeadbeef"),
      );
      expect(address).to.equal("0x60f3f640a8508fC6a86d45DF051962668E1e8AC7");
    });

    it("mines a deterministic salt whose address carries AFTER_INITIALIZE | AFTER_SWAP", function () {
      const creationCode = "0x6080604052" as Hex;
      const args = encodeHookConstructorArgs(POOL_MANAGER[8453]);
      const first = mineHookSalt(creationCode, args);
      const second = mineHookSalt(creationCode, args);

      expect(first).to.deep.equal(second);
      expect(hasHookFlags(first.hookAddress)).to.equal(true);
      expect(BigInt(first.hookAddress) & 0x3fffn).to.equal(HOOK_FLAGS);
      expect(first.hookAddress).to.equal(
        computeCreate2Address(CREATE2_DEPLOYER, first.salt, keccak256(concatHex([creationCode, args]))),
      );
    });

    it("rejects addresses whose low bits encode other permissions", function () {
      expect(hasHookFlags("0x0000000000000000000000000000000000001040")).to.equal(true);
      expect(hasHookFlags("0x0000000000000000000000000000000000001000")).to.equal(false); // AFTER_INITIALIZE only
      expect(hasHookFlags("0x0000000000000000000000000000000000001044")).to.equal(false); // + BEFORE_DONATE
      expect(hasHookFlags("0x0000000000000000000000000000000000000000")).to.equal(false);
    });
  });

  describe("deployment records", function () {
    for (const { chainId, network: networkName } of DEPLOYED_CHAINS) {
      it(`${networkName}: address encodes the hook flags and points at the chain's PoolManager`, function () {
        const file = path.join(__dirname, "..", "..", "deployments", networkName, "LimitOrderHook.json");
        const deployment = JSON.parse(readFileSync(file, "utf8"));

        expect(hasHookFlags(deployment.address)).to.equal(true);
        expect(deployment.args.map((a: string) => a.toLowerCase())).to.deep.equal([POOL_MANAGER[chainId].toLowerCase()]);
        expect(deployment.receipt.to.toLowerCase()).to.equal(CREATE2_DEPLOYER.toLowerCase());
        expect(deployment.receipt.blockHash).to.match(/^0x[0-9a-f]{64}$/);
        expect(deployment.receipt.blockHash).to.not.equal(`0x${"0".repeat(64)}`);
        expect(deployment.numDeployments).to.equal(1);
      });
    }
  });

  describe("CREATE2 deployment", function () {
    it("deploys the compiled hook at the mined address and the constructor accepts the flags", async function () {
      const [deployer] = await ethers.getSigners();
      const poolManager = POOL_MANAGER[8453];

      await network.provider.send("hardhat_setCode", [CREATE2_DEPLOYER, CREATE2_PROXY_RUNTIME_CODE]);

      const artifact = await artifacts.readArtifact(LIMIT_ORDER_HOOK_FQN);
      const constructorArgs = encodeHookConstructorArgs(poolManager);
      const { hookAddress, salt } = mineHookSalt(artifact.bytecode as Hex, constructorArgs);

      // The proxy takes `salt ++ initCode` and CREATE2s it; BaseHook's constructor reverts
      // (HookAddressNotValid) if the address bits do not match getHookPermissions().
      await (
        await deployer.sendTransaction({
          to: CREATE2_DEPLOYER,
          data: concatHex([salt, artifact.bytecode as Hex, constructorArgs]),
        })
      ).wait();

      expect(await ethers.provider.getCode(hookAddress)).to.not.equal("0x");

      const hook = await ethers.getContractAt(artifact.abi, hookAddress);
      expect((await hook.poolManager()).toLowerCase()).to.equal(poolManager.toLowerCase());
      const permissions = await hook.getHookPermissions();
      expect(permissions.afterInitialize).to.equal(true);
      expect(permissions.afterSwap).to.equal(true);
      expect(permissions.beforeSwap).to.equal(false);
      expect(permissions.beforeInitialize).to.equal(false);
    });
  });
});

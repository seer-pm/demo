import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AbiCoder, Contract, getAddress, keccak256 } from "ethers";
import { ethers, network } from "hardhat";
import AlgebraPoolData from "../helpers/abis/AlgebraPool.json";
import { swaprFixture } from "../helpers/fixtures";

function sqrt(value: bigint) {
  if (value < 0n) throw new Error("Negative input");
  if (value < 2n) return value;

  let x0 = value;
  let x1 = (x0 + value / x0) >> 1n;

  while (x1 < x0) {
    x0 = x1;
    x1 = (x0 + value / x0) >> 1n;
  }

  return x0;
}
const MaxUint256: bigint = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
export const MIN_TICK = -887272;
export const MAX_TICK = -MIN_TICK;

export const getMinTick = (tickSpacing: number) => Math.ceil(-887272 / tickSpacing) * tickSpacing;
export const getMaxTick = (tickSpacing: number) => Math.floor(887272 / tickSpacing) * tickSpacing;

export function getCreate2Address(
  poolDeployerAddress: string,
  [tokenA, tokenB]: [string, string],
  bytecode: string,
): string {
  const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];
  const constructorArgumentsEncoded = AbiCoder.defaultAbiCoder().encode(["address", "address"], [token0, token1]);
  const create2Inputs = [
    "0xff",
    poolDeployerAddress,
    // salt
    keccak256(constructorArgumentsEncoded),
    // init code. bytecode + constructor arguments
    keccak256(bytecode),
  ];
  const sanitizedInputs = `0x${create2Inputs.map((i) => i.slice(2)).join("")}`;
  return getAddress(`0x${keccak256(sanitizedInputs).slice(-40)}`);
}

describe("TradeManager", function () {
  let algebraFactory: Contract;
  let swapRouter: Contract;
  let poolDeployer: Contract;
  let minter: Contract;
  beforeEach(async function () {
    await network.provider.send("evm_setAutomine", [true]);
    const {
      algebraFactory: _algebraFactory,
      swapRouter: _swapRouter,
      poolDeployer: _poolDeployer,
      minter: _minter,
    } = await loadFixture(swaprFixture);
    algebraFactory = _algebraFactory;
    swapRouter = _swapRouter;
    poolDeployer = _poolDeployer;
    minter = _minter;
  });
  it("deploys a pool from 2 tokens", async function () {
    const [signer] = await ethers.getSigners();
    const token0 = await ethers.deployContract("CollateralToken");
    const token1 = await ethers.deployContract("CollateralToken");
    await algebraFactory.createPool(token0, token1, "0x");
    const poolAddress = await algebraFactory.poolByPair(token0, token1);
    const pool = new ethers.Contract(poolAddress, AlgebraPoolData.abi, signer);
    await token0.approve(minter, MaxUint256);
    await token1.approve(minter, MaxUint256);
    await pool.initialize((2n ** 96n * 1414n) / 1000n);
    await minter.mint(poolAddress, signer, getMinTick(60), getMaxTick(60), 5000n * 10n ** 18n);
    console.log(await token0.balanceOf(pool));
    console.log(await token1.balanceOf(pool));
  });
});

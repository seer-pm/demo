import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { Contract, Signer, ZeroAddress } from "ethers";
import { ethers, network } from "hardhat";
import {
  Address,
  CollateralToken,
  ConditionalTokens,
  Market,
  MarketFactory,
  Router,
  TradeManager,
  TradeQuoter,
} from "../../../typechain-types";
import { IERC20 } from "../../../typechain-types/src/Interfaces.sol";
import AlgebraPoolData from "../helpers/abis/AlgebraPool.json";
import { categoricalMarketParams, OPENING_TS } from "../helpers/constants";
import { marketFactoryDeployFixture, swaprFixture } from "../helpers/fixtures";

const MaxUint256: bigint = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
export const MIN_TICK = -887272;
export const MAX_TICK = -MIN_TICK;

export const getMinTick = (tickSpacing: number) => Math.ceil(-887272 / tickSpacing) * tickSpacing;
export const getMaxTick = (tickSpacing: number) => Math.floor(887272 / tickSpacing) * tickSpacing;

describe("TradeManager", function () {
  let algebraFactory: Contract;
  let swapRouter: Contract;
  let swapQuoter: Contract;
  let poolDeployer: Contract;
  let minter: Contract;
  let marketFactory: MarketFactory;
  let collateralToken: CollateralToken;
  let conditionalTokens: ConditionalTokens;
  let router: Router;
  let tradeManager: TradeManager;
  let tradeQuoter: TradeQuoter;
  let trader: Signer;

  beforeEach(async function () {
    await network.provider.send("evm_setAutomine", [true]);
    const {
      algebraFactory: _algebraFactory,
      swapRouter: _swapRouter,
      swapQuoter: _swapQuoter,
      poolDeployer: _poolDeployer,
      minter: _minter,
    } = await loadFixture(swaprFixture);
    const {
      marketFactory: _marketFactory,
      collateralToken: _collateralToken,
      conditionalTokens: _conditionalTokens,
      router: _router,
    } = await loadFixture(marketFactoryDeployFixture);
    algebraFactory = _algebraFactory;
    swapRouter = _swapRouter;
    swapQuoter = _swapQuoter;
    poolDeployer = _poolDeployer;
    minter = _minter;
    marketFactory = _marketFactory;
    collateralToken = _collateralToken as CollateralToken;
    conditionalTokens = _conditionalTokens;
    router = _router;
    [, trader] = await ethers.getSigners();
    await collateralToken.transfer(trader, 100000n * 10n ** 18n);
    tradeManager = await (
      await ethers.getContractFactory("TradeManager")
    ).deploy(swapRouter, router, conditionalTokens, collateralToken);
    tradeQuoter = await (await ethers.getContractFactory("TradeQuoter")).deploy(swapQuoter, conditionalTokens);
  });
  async function createPoolWithLiquidity(token0: IERC20, token1: IERC20, price: bigint, liquidity: bigint) {
    const [signer] = await ethers.getSigners();
    await algebraFactory.createPool(token0, token1);
    const poolAddress = await algebraFactory.poolByPair(token0, token1);
    const pool = new ethers.Contract(poolAddress, AlgebraPoolData.abi, signer);
    await token0.approve(minter, MaxUint256);
    await token1.approve(minter, MaxUint256);
    await pool.initialize(price);
    await minter.mint(poolAddress, signer, getMinTick(60), getMaxTick(60), liquidity);
    return pool;
  }
  async function quoteSwapSingle(
    amountIn: bigint,
    {
      tokenIn,
      tokenOut,
      tokenInMarket,
      tokenOutMarket,
    }: { tokenIn: Address; tokenOut: Address; tokenInMarket: Address; tokenOutMarket: Address },
  ) {
    try {
      return (
        await tradeQuoter!.quoteSwapSingle.staticCall({
          tokenIn,
          tokenOut,
          tokenInMarket,
          tokenOutMarket,
          amountIn,
        })
      )[0];
    } catch (e) {
      return 0n;
    }
  }

  async function quoteMintSingle(
    amountIn: bigint,
    {
      tokenIn,
      tokenOut,
      tokenInMarket,
      tokenOutMarket,
    }: { tokenIn: Address; tokenOut: Address; tokenInMarket: Address; tokenOutMarket: Address },
  ) {
    try {
      return (
        await tradeQuoter!.quoteMintSingle.staticCall({
          tokenIn,
          tokenOut,
          tokenInMarket,
          tokenOutMarket,
          amountIn,
        })
      )[0];
    } catch (e) {
      return 0n;
    }
  }

  async function quoteTradeSingleAndCompare(
    amountIn: bigint,
    {
      tokenIn,
      tokenOut,
      tokenInMarket,
      tokenOutMarket,
    }: { tokenIn: Address; tokenOut: Address; tokenInMarket: Address; tokenOutMarket: Address },
  ) {
    const [amountOutSwap, amountOutMint] = await Promise.all([
      quoteSwapSingle(amountIn, { tokenIn, tokenOut, tokenInMarket, tokenOutMarket }),
      quoteMintSingle(amountIn, { tokenIn, tokenOut, tokenInMarket, tokenOutMarket }),
    ]);
    if (amountOutSwap === 0n && amountOutMint === 0n) {
      throw "Cannot trade this pair";
    }

    return {
      choice: amountOutSwap > amountOutMint ? 0 : 1,
      amountOut: amountOutSwap > amountOutMint ? amountOutSwap : amountOutMint,
    };
  }

  async function getTradePaths(
    collateral: IERC20,
    market: Market,
    outcomeTokenAddress: string,
    amountIn: bigint,
    isBuy: boolean,
  ) {
    const ancestorMarkets: { marketId: string; token: string }[] = [
      { marketId: await market.getAddress(), token: outcomeTokenAddress },
    ];
    let currentMarketAddress = await market.parentMarket();
    let [currentToken] = await market.parentWrappedOutcome();
    while (currentMarketAddress !== ZeroAddress) {
      ancestorMarkets.push({ marketId: currentMarketAddress, token: currentToken });
      const currentMarket = await ethers.getContractAt("Market", currentMarketAddress);
      currentMarketAddress = await currentMarket.parentMarket();
      currentToken = (await currentMarket.parentWrappedOutcome())[0];
    }
    ancestorMarkets.push({
      marketId: ZeroAddress,
      token: await collateral.getAddress(),
    });
    if (isBuy) {
      ancestorMarkets.reverse();
    }
    let paths: TradeManager.TokenPathStruct[] = [];
    let amountIns = [amountIn];
    // static call each step -> get result to use in the next step + trade choice
    for (let i = 0; i < ancestorMarkets.length - 1; i++) {
      const tokenInData = ancestorMarkets[i];
      const tokenOutData = ancestorMarkets[i + 1];
      const { amountOut, choice } = await quoteTradeSingleAndCompare(amountIn, {
        tokenIn: tokenInData.token as unknown as Address,
        tokenOut: tokenOutData.token as unknown as Address,
        tokenInMarket: tokenInData.marketId as unknown as Address,
        tokenOutMarket: tokenOutData.marketId as unknown as Address,
      });
      amountIn = amountOut;
      paths.push({
        tokenIn: tokenInData.token,
        tokenOut: tokenOutData.token,
        tokenInMarket: tokenInData.marketId,
        tokenOutMarket: tokenOutData.marketId,
        choice,
      });
      amountIns.push(amountOut);
    }
    return { amountIns, paths };
  }
  describe("trade", function () {
    let market: Market;
    let firstOutcomeToken: IERC20;
    let secondOutcomeToken: IERC20;
    let thirdOutcomeToken: IERC20;
    beforeEach(async function () {
      const currentBlockTime = await time.latest();
      const marketAddress = await marketFactory.createCategoricalMarket.staticCall({
        ...categoricalMarketParams,
        openingTime: currentBlockTime + OPENING_TS,
      });
      await marketFactory.createCategoricalMarket({
        ...categoricalMarketParams,
        openingTime: currentBlockTime + OPENING_TS,
      });
      market = await ethers.getContractAt("Market", marketAddress);

      // split positions
      const splitAmount = ethers.parseEther("100000");
      await collateralToken.approve(router, splitAmount);
      // split collateral token to outcome tokens
      await router.splitPosition(collateralToken, market, splitAmount);

      // create pool and add liquidity for the first outcome token
      firstOutcomeToken = (await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        (
          await market.wrappedOutcome(0)
        )[0],
      )) as unknown as IERC20;

      secondOutcomeToken = (await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        (
          await market.wrappedOutcome(1)
        )[0],
      )) as unknown as IERC20;

      thirdOutcomeToken = (await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        (
          await market.wrappedOutcome(2)
        )[0],
      )) as unknown as IERC20;
    });
    describe("trade single market", function () {
      const amountIn = ethers.parseEther("50");
      beforeEach(async function () {
        const isCollateralToken1 =
          (await collateralToken.getAddress()).toLowerCase() > (await firstOutcomeToken.getAddress()).toLowerCase();
        await createPoolWithLiquidity(
          collateralToken as unknown as IERC20,
          firstOutcomeToken,
          isCollateralToken1 ? (2n ** 96n * 1000n) / 1414n : (2n ** 96n * 1414n) / 1000n,
          5000n * 10n ** 18n,
        );
      });
      it("quotes a reasonable amount for swapping first outcome tokens", async function () {
        const [amountOut] = await tradeQuoter.quoteSwapSingle.staticCall({
          tokenIn: collateralToken,
          tokenOut: firstOutcomeToken,
          tokenInMarket: ZeroAddress,
          tokenOutMarket: market,
          amountIn,
        });
        expect(amountOut).to.be.greaterThan(amountIn);
      });
      it("reverts if try to quote for swapping second outcome tokens", async function () {
        await expect(
          tradeQuoter.quoteSwapSingle.staticCall({
            tokenIn: collateralToken,
            tokenOut: secondOutcomeToken,
            tokenInMarket: ZeroAddress,
            tokenOutMarket: market,
            amountIn,
          }),
        ).to.be.reverted;
      });
      it("quotes a reasonable amount for minting second outcome tokens", async function () {
        const [amountOut] = await tradeQuoter.quoteMintSingle.staticCall({
          tokenIn: collateralToken,
          tokenOut: secondOutcomeToken,
          tokenInMarket: ZeroAddress,
          tokenOutMarket: market,
          amountIn,
        });
        expect(amountOut).to.equal(amountIn);
      });
      it("is able to buy first outcome using swap path", async function () {
        const balanceBeforeSwap = await firstOutcomeToken.balanceOf(trader);
        expect(balanceBeforeSwap).to.equal(0);
        await collateralToken.connect(trader).approve(tradeManager, amountIn);
        await tradeManager.connect(trader).exactInput(
          [
            {
              tokenIn: collateralToken,
              tokenOut: firstOutcomeToken,
              tokenInMarket: ZeroAddress,
              tokenOutMarket: market,
              choice: 0,
            },
          ],
          {
            recipient: trader,
            originalRecipient: trader,
            deadline: Math.floor(new Date().getTime() / 1000) + 3600,
            amountIn,
            amountOutMinimum: 0,
          },
        );
        const balanceAfterSwap = await firstOutcomeToken.balanceOf(trader);
        expect(balanceAfterSwap).to.be.greaterThan(amountIn);
      });
      it("is able to sell first outcome using swap path", async function () {
        await firstOutcomeToken.transfer(await trader.getAddress(), amountIn);
        const balanceBeforeSwap = await firstOutcomeToken.balanceOf(trader);
        const collateralBalanceBeforeSwap = await collateralToken.balanceOf(trader);
        expect(balanceBeforeSwap).to.equal(amountIn);
        await firstOutcomeToken.connect(trader).approve(tradeManager, amountIn);
        const amountOut = await tradeManager.connect(trader).exactInput.staticCall(
          [
            {
              tokenIn: firstOutcomeToken,
              tokenOut: collateralToken,
              tokenInMarket: ZeroAddress,
              tokenOutMarket: market,
              choice: 0,
            },
          ],
          {
            recipient: trader,
            originalRecipient: trader,
            deadline: Math.floor(new Date().getTime() / 1000) + 3600,
            amountIn,
            amountOutMinimum: 0,
          },
        );
        await tradeManager.connect(trader).exactInput(
          [
            {
              tokenIn: firstOutcomeToken,
              tokenOut: collateralToken,
              tokenInMarket: ZeroAddress,
              tokenOutMarket: market,
              choice: 0,
            },
          ],
          {
            recipient: trader,
            originalRecipient: trader,
            deadline: Math.floor(new Date().getTime() / 1000) + 3600,
            amountIn,
            amountOutMinimum: 0,
          },
        );
        const balanceAfterSwap = await firstOutcomeToken.balanceOf(trader);
        expect(balanceAfterSwap).to.equal(0);
        expect(await collateralToken.balanceOf(trader)).to.equal(collateralBalanceBeforeSwap + amountOut);
      });
      it("is able to buy first outcome using mint path", async function () {
        const balanceBeforeSwap = await firstOutcomeToken.balanceOf(trader);
        expect(balanceBeforeSwap).to.equal(0);
        await collateralToken.connect(trader).approve(tradeManager, amountIn);
        await tradeManager.connect(trader).exactInput(
          [
            {
              tokenIn: collateralToken,
              tokenOut: firstOutcomeToken,
              tokenInMarket: ZeroAddress,
              tokenOutMarket: market,
              choice: 1,
            },
          ],
          {
            recipient: trader,
            originalRecipient: trader,
            deadline: Math.floor(new Date().getTime() / 1000) + 3600,
            amountIn,
            amountOutMinimum: 0,
          },
        );
        const balanceAfterSwap = await firstOutcomeToken.balanceOf(trader);
        expect(balanceAfterSwap).to.equal(amountIn);
      });
      it("is not able to buy second outcome using swap path, but can use mint path", async function () {
        const balanceBeforeSwap = await secondOutcomeToken.balanceOf(trader);
        expect(balanceBeforeSwap).to.equal(0);
        await collateralToken.connect(trader).approve(tradeManager, amountIn);
        await expect(
          tradeManager.connect(trader).exactInput(
            [
              {
                tokenIn: collateralToken,
                tokenOut: secondOutcomeToken,
                tokenInMarket: ZeroAddress,
                tokenOutMarket: market,
                choice: 0,
              },
            ],
            {
              recipient: trader,
              originalRecipient: trader,
              deadline: Math.floor(new Date().getTime() / 1000) + 3600,
              amountIn,
              amountOutMinimum: 0,
            },
          ),
        ).to.be.reverted;
        await tradeManager.connect(trader).exactInput(
          [
            {
              tokenIn: collateralToken,
              tokenOut: secondOutcomeToken,
              tokenInMarket: ZeroAddress,
              tokenOutMarket: market,
              choice: 1,
            },
          ],
          {
            recipient: trader,
            originalRecipient: trader,
            deadline: Math.floor(new Date().getTime() / 1000) + 3600,
            amountIn,
            amountOutMinimum: 0,
          },
        );
        const balanceAfterSwap = await secondOutcomeToken.balanceOf(trader);
        expect(balanceAfterSwap).to.equal(amountIn);
      });
    });

    describe("trade conditional market", function () {
      const amountIn = ethers.parseEther("50");
      let conditionalMarket: Market;
      let firstConditionalOutcomeToken: IERC20;
      let secondConditionalOutcomeToken: IERC20;
      let thirdConditionalOutcomeToken: IERC20;
      beforeEach(async function () {
        const currentBlockTime = await time.latest();
        const marketAddress = await marketFactory.createCategoricalMarket.staticCall({
          ...categoricalMarketParams,
          openingTime: currentBlockTime + OPENING_TS,
          parentMarket: market,
          parentOutcome: 0,
        });
        await marketFactory.createCategoricalMarket({
          ...categoricalMarketParams,
          openingTime: currentBlockTime + OPENING_TS,
          parentMarket: market,
          parentOutcome: 0,
        });
        conditionalMarket = await ethers.getContractAt("Market", marketAddress);

        // split positions
        const splitAmount = ethers.parseEther("30000");
        await firstOutcomeToken.approve(router, splitAmount);
        // split first outcome tokens to outcome tokens
        await router.splitPosition(collateralToken, conditionalMarket, splitAmount);

        firstConditionalOutcomeToken = (await ethers.getContractAt(
          "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
          (
            await conditionalMarket.wrappedOutcome(0)
          )[0],
        )) as unknown as IERC20;

        secondConditionalOutcomeToken = (await ethers.getContractAt(
          "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
          (
            await conditionalMarket.wrappedOutcome(1)
          )[0],
        )) as unknown as IERC20;

        thirdConditionalOutcomeToken = (await ethers.getContractAt(
          "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
          (
            await conditionalMarket.wrappedOutcome(2)
          )[0],
        )) as unknown as IERC20;
      });
      it("gets third conditional outcome tokens from collateral without any pools", async function () {
        const { paths, amountIns } = await getTradePaths(
          collateralToken as unknown as IERC20,
          conditionalMarket,
          await thirdConditionalOutcomeToken.getAddress(),
          amountIn,
          true,
        );
        expect(paths[0].choice).to.equal(1);
        expect(paths[1].choice).to.equal(1);
        expect(amountIns[1]).to.equal(amountIns[0]);
        expect(amountIns[2]).to.equal(amountIns[1]);
        const balancesBeforeTrade = await Promise.all([
          firstOutcomeToken.balanceOf(trader),
          secondOutcomeToken.balanceOf(trader),
          thirdOutcomeToken.balanceOf(trader),
          firstConditionalOutcomeToken.balanceOf(trader),
          secondConditionalOutcomeToken.balanceOf(trader),
          thirdConditionalOutcomeToken.balanceOf(trader),
        ]);
        expect(balancesBeforeTrade).to.deep.equal([0, 0, 0, 0, 0, 0]);
        await collateralToken.connect(trader).approve(tradeManager, amountIn);
        const amountOut = await tradeManager.connect(trader).exactInput.staticCall(paths, {
          recipient: trader,
          originalRecipient: trader,
          deadline: Math.floor(new Date().getTime() / 1000) + 3600,
          amountIn,
          amountOutMinimum: 0,
        });
        // amountOut equal to amountIn
        expect(amountOut).to.equal(amountIn);
        await tradeManager.connect(trader).exactInput(paths, {
          recipient: trader,
          originalRecipient: trader,
          deadline: Math.floor(new Date().getTime() / 1000) + 3600,
          amountIn,
          amountOutMinimum: 0,
        });
        const balancesAfterTrade = await Promise.all([
          firstOutcomeToken.balanceOf(trader),
          secondOutcomeToken.balanceOf(trader),
          thirdOutcomeToken.balanceOf(trader),
          firstConditionalOutcomeToken.balanceOf(trader),
          secondConditionalOutcomeToken.balanceOf(trader),
          thirdConditionalOutcomeToken.balanceOf(trader),
        ]);
        // we use firstOutcomeToken to mint a full set of conditional tokens so the balance should be 0
        expect(balancesAfterTrade).to.deep.equal([0, amountIn, amountIn, amountIn, amountIn, amountIn]);
      });
      describe("mint on parent market, swap or mint on conditional market", function () {
        // we only provide liquidity to the conditional market
        beforeEach(async function () {
          const isCollateralToken1 =
            (await firstOutcomeToken.getAddress()).toLowerCase() >
            (await firstConditionalOutcomeToken.getAddress()).toLowerCase();
          await createPoolWithLiquidity(
            firstOutcomeToken,
            firstConditionalOutcomeToken,
            isCollateralToken1 ? (2n ** 96n * 1000n) / 1414n : (2n ** 96n * 1414n) / 1000n,
            5000n * 10n ** 18n,
          );
        });
        it("mints on parent market, swaps on conditional market", async function () {
          const { paths, amountIns } = await getTradePaths(
            collateralToken as unknown as IERC20,
            conditionalMarket,
            await firstConditionalOutcomeToken.getAddress(),
            amountIn,
            true,
          );
          expect(paths[0].choice).to.equal(1);
          expect(paths[1].choice).to.equal(0);
          expect(amountIns[1]).to.equal(amountIns[0]);
          expect(amountIns[2]).to.be.greaterThan(amountIns[1]);
          const balancesBeforeTrade = await Promise.all([
            firstOutcomeToken.balanceOf(trader),
            secondOutcomeToken.balanceOf(trader),
            thirdOutcomeToken.balanceOf(trader),
            firstConditionalOutcomeToken.balanceOf(trader),
            secondConditionalOutcomeToken.balanceOf(trader),
            thirdConditionalOutcomeToken.balanceOf(trader),
          ]);
          expect(balancesBeforeTrade).to.deep.equal([0, 0, 0, 0, 0, 0]);
          await collateralToken.connect(trader).approve(tradeManager, amountIn);
          const amountOut = await tradeManager.connect(trader).exactInput.staticCall(paths, {
            recipient: trader,
            originalRecipient: trader,
            deadline: Math.floor(new Date().getTime() / 1000) + 3600,
            amountIn,
            amountOutMinimum: 0,
          });
          // amountOut equal to quote
          expect(amountOut).to.equal(amountIns[amountIns.length - 1]);
          await tradeManager.connect(trader).exactInput(paths, {
            recipient: trader,
            originalRecipient: trader,
            deadline: Math.floor(new Date().getTime() / 1000) + 3600,
            amountIn,
            amountOutMinimum: 0,
          });
          const balancesAfterTrade = await Promise.all([
            firstOutcomeToken.balanceOf(trader),
            secondOutcomeToken.balanceOf(trader),
            thirdOutcomeToken.balanceOf(trader),
            firstConditionalOutcomeToken.balanceOf(trader),
            secondConditionalOutcomeToken.balanceOf(trader),
            thirdConditionalOutcomeToken.balanceOf(trader),
          ]);
          expect(balancesAfterTrade).to.deep.equal([0, amountIn, amountIn, amountOut, 0, 0]);
        });
        describe("mint on parent market, mint on conditional market", function () {
          beforeEach(async function () {
            const isCollateralToken1 =
              (await firstOutcomeToken.getAddress()).toLowerCase() >
              (await secondConditionalOutcomeToken.getAddress()).toLowerCase();
            // to select mint, mint result > swap result

            await createPoolWithLiquidity(
              firstOutcomeToken,
              secondConditionalOutcomeToken,
              isCollateralToken1 ? (2n ** 96n * 1000n) / 1100n : (2n ** 96n * 1100n) / 1000n,
              5000n * 10n ** 18n,
            );
          });
          it("mints on parent market, mints on conditional market", async function () {
            const { paths, amountIns } = await getTradePaths(
              collateralToken as unknown as IERC20,
              conditionalMarket,
              await firstConditionalOutcomeToken.getAddress(),
              amountIn,
              true,
            );
            expect(paths[0].choice).to.equal(1);
            expect(paths[1].choice).to.equal(1);
            expect(amountIns[1]).to.equal(amountIns[0]);
            expect(amountIns[2]).to.be.greaterThan(amountIns[1]);
            const balancesBeforeTrade = await Promise.all([
              firstOutcomeToken.balanceOf(trader),
              secondOutcomeToken.balanceOf(trader),
              thirdOutcomeToken.balanceOf(trader),
              firstConditionalOutcomeToken.balanceOf(trader),
              secondConditionalOutcomeToken.balanceOf(trader),
              thirdConditionalOutcomeToken.balanceOf(trader),
            ]);
            expect(balancesBeforeTrade).to.deep.equal([0, 0, 0, 0, 0, 0]);
            await collateralToken.connect(trader).approve(tradeManager, amountIn);
            const amountOut = await tradeManager.connect(trader).exactInput.staticCall(paths, {
              recipient: trader,
              originalRecipient: trader,
              deadline: Math.floor(new Date().getTime() / 1000) + 3600,
              amountIn,
              amountOutMinimum: 0,
            });
            // amountOut equal to quote
            expect(amountOut).to.equal(amountIns[amountIns.length - 1]);
            await tradeManager.connect(trader).exactInput(paths, {
              recipient: trader,
              originalRecipient: trader,
              deadline: Math.floor(new Date().getTime() / 1000) + 3600,
              amountIn,
              amountOutMinimum: 0,
            });
            const balancesAfterTrade = await Promise.all([
              firstOutcomeToken.balanceOf(trader),
              secondOutcomeToken.balanceOf(trader),
              thirdOutcomeToken.balanceOf(trader),
              firstConditionalOutcomeToken.balanceOf(trader),
              secondConditionalOutcomeToken.balanceOf(trader),
              thirdConditionalOutcomeToken.balanceOf(trader),
            ]);
            // After mint conditional, it will try to sell 2nd and 3rd conditional outcomes, but only 2nd has liquidity
            expect(balancesAfterTrade).to.deep.equal([0, amountIn, amountIn, amountOut, 0, amountIn]);
          });
        });
        describe("sell conditional tokens to collateral", function () {
          beforeEach(async function () {
            const isCollateralToken1 =
              (await collateralToken.getAddress()).toLowerCase() > (await firstOutcomeToken.getAddress()).toLowerCase();
            await createPoolWithLiquidity(
              collateralToken as unknown as IERC20,
              firstOutcomeToken,
              isCollateralToken1 ? (2n ** 96n * 1000n) / 1414n : (2n ** 96n * 1414n) / 1000n,
              5000n * 10n ** 18n,
            );
          });
          it("cannot quote price to sell second conditional outcome tokens to collateral", async function () {
            await expect(
              getTradePaths(
                collateralToken as unknown as IERC20,
                conditionalMarket,
                await secondConditionalOutcomeToken.getAddress(),
                amountIn,
                false,
              ),
            ).to.rejectedWith("Cannot trade this pair");
          });
          it("sells first conditional outcome tokens to collateral", async function () {
            const { paths, amountIns } = await getTradePaths(
              collateralToken as unknown as IERC20,
              conditionalMarket,
              await firstConditionalOutcomeToken.getAddress(),
              amountIn,
              false,
            );
            expect(paths[0].choice).to.equal(0);
            expect(paths[1].choice).to.equal(0);
            expect(amountIns[1]).to.be.lessThan(amountIns[0]);
            expect(amountIns[2]).to.be.lessThan(amountIns[1]);
            await firstConditionalOutcomeToken.transfer(trader, amountIn);
            const balancesBeforeTrade = await Promise.all([
              firstOutcomeToken.balanceOf(trader),
              secondOutcomeToken.balanceOf(trader),
              thirdOutcomeToken.balanceOf(trader),
              firstConditionalOutcomeToken.balanceOf(trader),
              secondConditionalOutcomeToken.balanceOf(trader),
              thirdConditionalOutcomeToken.balanceOf(trader),
            ]);
            const collateralBalanceBeforeTrade = await collateralToken.balanceOf(trader);
            expect(balancesBeforeTrade).to.deep.equal([0, 0, 0, amountIn, 0, 0]);
            await firstConditionalOutcomeToken.connect(trader).approve(tradeManager, amountIn);
            const amountOut = await tradeManager.connect(trader).exactInput.staticCall(paths, {
              recipient: trader,
              originalRecipient: trader,
              deadline: Math.floor(new Date().getTime() / 1000) + 3600,
              amountIn,
              amountOutMinimum: 0,
            });
            // amountOut equal to quote
            expect(amountOut).to.equal(amountIns[amountIns.length - 1]);
            await tradeManager.connect(trader).exactInput(paths, {
              recipient: trader,
              originalRecipient: trader,
              deadline: Math.floor(new Date().getTime() / 1000) + 3600,
              amountIn,
              amountOutMinimum: 0,
            });
            const balancesAfterTrade = await Promise.all([
              firstOutcomeToken.balanceOf(trader),
              secondOutcomeToken.balanceOf(trader),
              thirdOutcomeToken.balanceOf(trader),
              firstConditionalOutcomeToken.balanceOf(trader),
              secondConditionalOutcomeToken.balanceOf(trader),
              thirdConditionalOutcomeToken.balanceOf(trader),
            ]);
            expect(balancesAfterTrade).to.deep.equal([0, 0, 0, 0, 0, 0]);
            expect(await collateralToken.balanceOf(trader)).to.equal(collateralBalanceBeforeTrade + amountOut);
          });
        });
      });
    });
  });
});

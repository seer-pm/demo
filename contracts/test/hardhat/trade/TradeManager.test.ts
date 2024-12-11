import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, network } from "hardhat";
import { TradeManager, TradeQuoter } from "../../../typechain-types";
import { GnosisAddress } from "../helpers/constants";
import { Address } from "viem";
import { ZeroAddress } from "ethers";
import { expect } from "chai";

describe("TradeManager", function () {
  let tradeManager: TradeManager | undefined;
  let tradeQuoter: TradeQuoter | undefined;
  let signer: HardhatEthersSigner | undefined;
  const xDAI = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const sDAIAddress = "0xaf204776c7245bF4147c2612BF6e5972Ee483701";
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
    marketId: string,
    outcomeTokenAddress: string,
    amountIn: bigint,
    isUseXDai: boolean,
    isBuy: boolean,
  ) {
    const market = await ethers.getContractAt("Market", marketId);
    const ancestorMarkets: { marketId: string; token: string }[] = [
      { marketId: await market.getAddress(), token: outcomeTokenAddress },
    ];
    let currentMarketAddress = await market.parentMarket();
    let [currentToken] = await market.parentWrappedOutcome();
    while (currentMarketAddress !== ZeroAddress) {
      ancestorMarkets.push({ marketId: currentMarketAddress, token: currentToken });
      currentMarketAddress = await (await ethers.getContractAt("Market", currentMarketAddress)).parentMarket();
      currentToken = (await market.parentWrappedOutcome())[0];
    }
    ancestorMarkets.push({
      marketId: ZeroAddress,
      token: isUseXDai ? xDAI : sDAIAddress,
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
        tokenIn: tokenInData.token as Address,
        tokenOut: tokenOutData.token as Address,
        tokenInMarket: tokenInData.marketId as Address,
        tokenOutMarket: tokenOutData.marketId as Address,
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

  beforeEach(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: GnosisAddress.RPC_URL,
          },
        },
      ],
    });
    await network.provider.send("evm_setAutomine", [true]);

    tradeManager = await ethers.deployContract("TradeManager");
    tradeQuoter = await ethers.deployContract("TradeQuoter");
    signer = (await ethers.getSigners())[0];
    await network.provider.send("hardhat_setBalance", [signer.address, ethers.toBeHex(ethers.parseEther("1000"))]);
  });

  describe("buy conditional outcome tokens", function () {
    const marketId = "0xb2f835a4e5bb077f2910898f6b5baf013b9a972c";
    const outcomeTokenAddress = "0x0ceef08e7682bf6a6d0ef7713957a6c7ce9e249e";
    it("buys conditional outcome tokens from sDAI", async function () {
      const { amountIns, paths } = await getTradePaths(
        marketId,
        outcomeTokenAddress,
        ethers.parseEther("50"),
        false,
        true,
      );
      for (let i = 0; i < amountIns.length - 1; i++) {
        expect(amountIns[i + 1]).to.be.greaterThanOrEqual(amountIns[i]);
      }
      // outcome tokens of parent market + outcome tokens of target market
      const tokens = [
        sDAIAddress,
        "0xed153570ab3b2665e4b678795a7bf8f88594c444",
        "0xf83237fa1e69b203b33bf84408faa80531a25db8",
        "0x88179e7def54113d1ff659bc66336d974a4a17f7",
        outcomeTokenAddress,
        "0xf9b107599c0642b94d86bb565dee8b27302fa111",
        "0xeb273757cbb260383210e0be24f32409454be248",
      ];
      const savingsXDaiAdapter = await ethers.getContractAt(
        "ISavingsXDaiAdapter",
        "0xD499b51fcFc66bd31248ef4b28d656d67E591A94",
      );
      await savingsXDaiAdapter.depositXDAI(signer!.address, { value: ethers.parseEther("100") });

      const balancesBeforeOfSigner = await Promise.all(
        tokens.map(async (token) => {
          const balance = await (
            await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", token)
          ).balanceOf(signer!.address);
          if (token !== sDAIAddress) {
            expect(balance).to.equal(0);
          }
          return balance;
        }),
      );
      await Promise.all(
        tokens.map(async (token) => {
          const balance = await (
            await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", token)
          ).balanceOf(tradeManager);
          expect(balance).to.equal(0);
          return balance;
        }),
      );
      const sDai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", sDAIAddress);
      await sDai.approve(tradeManager!, ethers.parseEther("50"));
      await tradeManager!.exactInput(paths, {
        recipient: signer!.address,
        originalRecipient: signer!.address,
        deadline: Math.floor(new Date().getTime() / 1000) + 3600,
        amountIn: ethers.parseEther("50"),
        amountOutMinimum: 0,
      });
      await Promise.all(
        tokens.map(async (token) => {
          const balance = await (
            await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", token)
          ).balanceOf(signer!.address);
          if (token === sDAIAddress) {
            expect(balancesBeforeOfSigner[0] - balance).to.equal(ethers.parseEther("50"));
          } else if (token === outcomeTokenAddress) {
            //should be able to get what we quoted
            expect(balance).to.equal(amountIns[amountIns.length - 1]);
          }

          return balance;
        }),
      );

      // trade manager should not hold anything after trade
      await Promise.all(
        tokens.map(async (token) => {
          const balance = await (
            await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", token)
          ).balanceOf(tradeManager);
          expect(balance).to.equal(0);
          return balance;
        }),
      );
    });

    it("buys conditional outcome tokens from xDAI", async function () {
      const xDaiBalanceBefore = await ethers.provider.getBalance(signer!);
      const { amountIns, paths } = await getTradePaths(
        marketId,
        outcomeTokenAddress,
        ethers.parseEther("50"),
        true,
        true,
      );
      for (let i = 0; i < amountIns.length - 1; i++) {
        expect(amountIns[i + 1]).to.be.greaterThanOrEqual(amountIns[i]);
      }
      // outcome tokens of parent market + outcome tokens of target market
      const tokens = [
        "0xed153570ab3b2665e4b678795a7bf8f88594c444",
        "0xf83237fa1e69b203b33bf84408faa80531a25db8",
        "0x88179e7def54113d1ff659bc66336d974a4a17f7",
        outcomeTokenAddress,
        "0xf9b107599c0642b94d86bb565dee8b27302fa111",
        "0xeb273757cbb260383210e0be24f32409454be248",
      ];
      await Promise.all(
        tokens.map(async (token) => {
          const balance = await (
            await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", token)
          ).balanceOf(signer!.address);
          expect(balance).to.equal(0);
          return balance;
        }),
      );
      await Promise.all(
        tokens.map(async (token) => {
          const balance = await (
            await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", token)
          ).balanceOf(tradeManager);
          expect(balance).to.equal(0);
          return balance;
        }),
      );
      const trx = await tradeManager!.exactInput(
        paths,
        {
          recipient: signer!.address,
          originalRecipient: signer!.address,
          deadline: Math.floor(new Date().getTime() / 1000) + 3600,
          amountIn: 0,
          amountOutMinimum: 0,
        },
        { value: ethers.parseEther("50") },
      );
      const receipt = await trx.wait(1);
      const { gasPrice = 0n, gasUsed = 0n } = receipt ?? {};
      const xDaiBalanceAfter = await ethers.provider.getBalance(signer!);
      expect(xDaiBalanceAfter).to.equal(xDaiBalanceBefore - ethers.parseEther("50") - gasPrice * gasUsed);

      await Promise.all(
        tokens.map(async (token) => {
          const balance = await (
            await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", token)
          ).balanceOf(signer!.address);
          if (token === outcomeTokenAddress) {
            //should be able to get what we quoted
            expect(balance).to.equal(amountIns[amountIns.length - 1]);
          }

          return balance;
        }),
      );

      // trade manager should not hold anything after trade
      await Promise.all(
        tokens.map(async (token) => {
          const balance = await (
            await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", token)
          ).balanceOf(tradeManager);
          expect(balance).to.equal(0);
          return balance;
        }),
      );
    });
  });

  describe("sell normal outcome tokens", function () {
    const marketId = "0xe20779a9a69a11eec73862611fd25056b06652f7";
    const outcomeTokenAddress = "0xed153570ab3b2665e4b678795a7bf8f88594c444";
    it("buys then sells outcome tokens", async function () {
      const outcomeToken = await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        outcomeTokenAddress,
      );
      const { amountIns, paths } = await getTradePaths(
        marketId,
        outcomeTokenAddress,
        ethers.parseEther("50"),
        true,
        true,
      );
      for (let i = 0; i < amountIns.length - 1; i++) {
        expect(amountIns[i + 1]).to.be.greaterThanOrEqual(amountIns[i]);
      }
      // buy first
      await tradeManager!.exactInput(
        paths,
        {
          recipient: signer!.address,
          originalRecipient: signer!.address,
          deadline: Math.floor(new Date().getTime() / 1000) + 3600,
          amountIn: amountIns[0],
          amountOutMinimum: 0,
        },
        { value: ethers.parseEther("50") },
      );

      expect(await outcomeToken.balanceOf(signer!.address)).to.equal(amountIns[amountIns.length - 1]);

      // sell half
      const { amountIns: amountInsSell, paths: pathsSell } = await getTradePaths(
        marketId,
        outcomeTokenAddress,
        amountIns[amountIns.length - 1] / 2n,
        true,
        false,
      );
      for (let i = 0; i < amountIns.length - 1; i++) {
        expect(amountIns[i + 1]).to.be.greaterThanOrEqual(amountIns[i]);
      }
      const xDaiBalanceBeforeSell = await ethers.provider.getBalance(signer!);
      await outcomeToken.approve(tradeManager, amountInsSell[0]);
      await tradeManager!.exactInput(pathsSell, {
        recipient: signer!.address,
        originalRecipient: signer!.address,
        deadline: Math.floor(new Date().getTime() / 1000) + 3600,
        amountIn: amountInsSell[0],
        amountOutMinimum: 0,
      });

      expect(
        await (
          await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", outcomeTokenAddress)
        ).balanceOf(signer!.address),
      ).to.equal(amountIns[amountIns.length - 1] - amountIns[amountIns.length - 1] / 2n);
      expect(await ethers.provider.getBalance(signer!)).to.be.greaterThan(xDaiBalanceBeforeSell);
    });
  });
});

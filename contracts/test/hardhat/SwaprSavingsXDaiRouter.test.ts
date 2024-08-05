import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import {
  IERC20,
  INonfungiblePositionManager,
  IQuoter,
  ISwapRouter,
  SwaprSavingsXDaiRouter,
  Wrapped1155,
  WXDAI,
} from "../../typechain-types";
import { ETH_BALANCE, GnosisAddress } from "./helpers/constants";

describe("SwaprSavingsXDaiRouter", function () {
  // Constants
  const sDAIAddress = GnosisAddress.S_DAI;
  const wxDAIAddress = GnosisAddress.W_X_DAI;
  const swaprRouterAddress = GnosisAddress.SWAPR_ROUTER;
  const swaprQuoterAddress = GnosisAddress.SWAPR_QUOTER;
  const xDAI = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const outcomeTokenAddress = "0x0e4E7C6DeB7a9e73a2D7BE655fB0074FDdA25a71";
  const nonfungiblePositionManagerAddress = "0x91fD594c46D8B01E62dBDeBed2401dde01817834";

  // Interfaces
  let outcomeToken: Wrapped1155;
  let sDAI: IERC20;
  let wxDAI: WXDAI;
  let swaprRouter: ISwapRouter;
  let swaprQuoter: IQuoter;
  let liquidityManagement: INonfungiblePositionManager;

  // Contract
  let swaprSXDaiRouter: SwaprSavingsXDaiRouter;

  // Signer
  let signer: SignerWithAddress;

  async function deployFixture() {
    [signer] = await ethers.getSigners();

    swaprSXDaiRouter = await ethers.deployContract("SwaprSavingsXDaiRouter");
    liquidityManagement = await ethers.getContractAt("INonfungiblePositionManager", nonfungiblePositionManagerAddress);

    outcomeToken = await ethers.getContractAt("Wrapped1155", outcomeTokenAddress);
    sDAI = (await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      sDAIAddress,
    )) as unknown as IERC20;
    wxDAI = await ethers.getContractAt("WXDAI", wxDAIAddress);
    swaprRouter = await ethers.getContractAt("ISwapRouter", swaprRouterAddress);
    swaprQuoter = await ethers.getContractAt("IQuoter", swaprQuoterAddress);

    return { swaprSXDaiRouter, signer };
  }

  async function reset(shouldLoadFixture = false) {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: GnosisAddress.RPC_URL,
            blockNumber: 35324720,
          },
        },
      ],
    });
    await network.provider.send("evm_setAutomine", [true]);
    if (shouldLoadFixture) {
      await loadFixture(deployFixture);
    } else {
      swaprSXDaiRouter = await ethers.deployContract("SwaprSavingsXDaiRouter");
    }

    await network.provider.send("hardhat_setBalance", [signer.address, "0x" + ethers.parseEther("50000").toString(16)]);
    // transfer some wxDAI and sDAI from a whale
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [GnosisAddress.WXDAI_SDAI_WHALE],
    });

    const whale = await ethers.getSigner(GnosisAddress.WXDAI_SDAI_WHALE);
    await wxDAI.connect(whale).transfer(signer.address, ethers.parseEther("50000"));
    await sDAI.connect(whale).transfer(signer.address, ethers.parseEther("50000"));
    await network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [GnosisAddress.WXDAI_SDAI_WHALE],
    });
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [GnosisAddress.WRAPPED_1155_FACTORY],
    });

    await network.provider.send("hardhat_setBalance", [
      GnosisAddress.WRAPPED_1155_FACTORY,
      ethers.toBeHex(ethers.parseEther(ETH_BALANCE)),
    ]);

    const factory = await ethers.getSigner(GnosisAddress.WRAPPED_1155_FACTORY);
    await outcomeToken.connect(factory).mint(signer.address, ethers.parseEther("50000"));
    await network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [GnosisAddress.WRAPPED_1155_FACTORY],
    });
    await addLiquidity();
  }

  before(async function () {
    await reset(true);
  });
  beforeEach(async function () {
    await reset();
  });

  async function addLiquidity() {
    // we set sDAI/outcome token price very close to 1 by providing an equally large amount of both tokens
    await sDAI.approve(liquidityManagement, ethers.parseEther("30000"));
    await outcomeToken.approve(liquidityManagement, ethers.parseEther("30000"));
    await liquidityManagement.mint({
      token0: outcomeToken,
      token1: sDAI,
      tickLower: -887220,
      tickUpper: 887220,
      amount0Desired: ethers.parseEther("30000"),
      amount1Desired: ethers.parseEther("30000"),
      amount0Min: 0,
      amount1Min: 0,
      recipient: signer.address,
      deadline: Math.floor(Date.now() / 1000) + 3600,
    });
  }

  async function getBalance(token: IERC20 | typeof xDAI, owner: string): Promise<bigint> {
    if (token === xDAI) {
      return await ethers.provider.getBalance(owner);
    }
    return await token.balanceOf(owner);
  }

  interface TokenBalances {
    tokenIn: bigint;
    tokenOut: bigint;
  }

  async function getBalances(
    tokenIn: IERC20 | typeof xDAI,
    tokenOut: IERC20 | typeof xDAI,
    owner: string,
  ): Promise<TokenBalances> {
    return {
      tokenIn: await getBalance(tokenIn, owner),
      tokenOut: await getBalance(tokenOut, owner),
    };
  }

  async function getBalancesChange(
    tokenIn: IERC20 | typeof xDAI,
    tokenInInitialBalance: bigint,
    tokenOut: IERC20 | typeof xDAI,
    tokenOutInitialBalance: bigint,
    owner: string,
    gas?: bigint,
  ): Promise<TokenBalances> {
    const currentBalances = await getBalances(tokenIn, tokenOut, owner);
    return {
      tokenIn: tokenInInitialBalance - currentBalances.tokenIn - (tokenIn === xDAI && gas ? gas : 0n),
      tokenOut: currentBalances.tokenOut - tokenOutInitialBalance - (tokenOut === xDAI && gas ? gas : 0n),
    };
  }

  async function swapExactInputSwaprSavingsXDAIRouter(
    amountIn: bigint,
    tokenIn: IERC20 | typeof xDAI,
    tokenOut: IERC20 | typeof xDAI,
    msgValue?: bigint,
  ) {
    await reset();
    const initialBalances = await getBalances(tokenIn, tokenOut, signer.address);
    const tokenInAddress = tokenIn === xDAI ? xDAI : await tokenIn.getAddress();
    const tokenOutAddress = tokenOut === xDAI ? xDAI : await tokenOut.getAddress();
    // Approve tokens if needed
    if (tokenInAddress !== xDAI) {
      await (tokenIn as IERC20).approve(await swaprSXDaiRouter.getAddress(), amountIn);
      await (tokenIn as IERC20).approve(swaprRouterAddress, amountIn);
    }

    const params = {
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      recipient: signer.address,
      deadline: Math.floor(Date.now() / 1000) + 3600,
      amountIn: amountIn,
      amountOutMinimum: 0n,
      limitSqrtPrice: 0n,
    };

    // SwaprSavingsXDaiRouter swap
    const [quotedAmountOut] = await swaprSXDaiRouter.quoteExactInputSingle.staticCall(
      params.tokenIn,
      params.tokenOut,
      amountIn,
      0n,
    );
    let amountOut;
    let tx;
    if (tokenInAddress === xDAI) {
      amountOut = await swaprSXDaiRouter.exactInputSingle.staticCall(params, { value: msgValue ?? amountIn });
      tx = await swaprSXDaiRouter.exactInputSingle(params, { value: msgValue ?? amountIn });
    } else {
      amountOut = await swaprSXDaiRouter.exactInputSingle.staticCall(params);
      tx = await swaprSXDaiRouter.exactInputSingle(params);
    }
    const receipt = await tx.wait();
    const { gasPrice = 0n, gasUsed = 0n } = receipt ?? {};
    const balancesChange = await getBalancesChange(
      tokenIn,
      initialBalances.tokenIn,
      tokenOut,
      initialBalances.tokenOut,
      signer.address,
      gasPrice * gasUsed,
    );
    return { amountOut, quotedAmountOut, balancesChange };
  }

  async function swapExactInputSwaprRouter(
    amountIn: bigint,
    tokenIn: IERC20 | typeof xDAI,
    tokenOut: IERC20 | typeof xDAI,
  ) {
    await reset();
    const initialBalances = await getBalances(tokenIn, tokenOut, signer.address);
    const tokenInAddress = tokenIn === xDAI ? xDAI : await tokenIn.getAddress();
    const tokenOutAddress = tokenOut === xDAI ? xDAI : await tokenOut.getAddress();
    // Approve tokens if needed
    if (tokenInAddress !== xDAI) {
      await (tokenIn as IERC20).approve(await swaprSXDaiRouter.getAddress(), amountIn);
      await (tokenIn as IERC20).approve(swaprRouterAddress, amountIn);
    }

    const params = {
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      recipient: signer.address,
      deadline: Math.floor(Date.now() / 1000) + 3600,
      amountIn: amountIn,
      amountOutMinimum: 0n,
      limitSqrtPrice: 0n,
    };
    let quotedAmountOut;
    const path = ethers.solidityPacked(
      ["address", "address", "address"],
      [
        tokenInAddress === xDAI ? wxDAIAddress : tokenInAddress,
        sDAIAddress,
        tokenOutAddress === xDAI ? wxDAIAddress : tokenOutAddress,
      ],
    );
    const exactInputParams = {
      path,
      recipient: signer.address,
      deadline: Math.floor(Date.now() / 1000) + 3600,
      amountIn: amountIn,
      amountOutMinimum: 0n,
    };
    if (tokenInAddress === sDAIAddress || tokenOutAddress === sDAIAddress) {
      [quotedAmountOut] = await swaprQuoter.quoteExactInputSingle.staticCall(
        params.tokenIn,
        params.tokenOut,
        amountIn,
        0n,
      );
    } else {
      [quotedAmountOut] = await swaprQuoter.quoteExactInput.staticCall(path, amountIn);
    }
    let amountOut;
    let tx;
    if (tokenInAddress === sDAIAddress || tokenOutAddress === sDAIAddress) {
      amountOut = await swaprRouter.exactInputSingle.staticCall(params);
      tx = await swaprRouter.exactInputSingle(params);
    } else {
      if (tokenInAddress === xDAI) {
        amountOut = await swaprRouter.exactInput.staticCall(exactInputParams, { value: amountIn });
        tx = await swaprRouter.exactInput(exactInputParams, { value: amountIn });
      } else {
        amountOut = await swaprRouter.exactInput.staticCall(exactInputParams);
        tx = await swaprRouter.exactInput(exactInputParams);
      }
    }
    const receipt = await tx.wait();
    const { gasPrice = 0n, gasUsed = 0n } = receipt ?? {};
    const balancesChange = await getBalancesChange(
      tokenIn,
      initialBalances.tokenIn,
      tokenOut,
      initialBalances.tokenOut,
      signer.address,
      gasPrice * gasUsed,
    );
    return { amountOut, quotedAmountOut, balancesChange };
  }

  async function assertSwapExactInputSingle(
    amountIn: bigint,
    tokenIn: IERC20 | typeof xDAI,
    tokenOut: IERC20 | typeof xDAI,
  ) {
    const tokenInAddress = tokenIn === xDAI ? xDAI : await tokenIn.getAddress();
    const tokenOutAddress = tokenOut === xDAI ? xDAI : await tokenOut.getAddress();
    const {
      amountOut: amountOut1,
      quotedAmountOut: quotedAmountOut1,
      balancesChange: balancesChange1,
    } = await swapExactInputSwaprSavingsXDAIRouter(amountIn, tokenIn, tokenOut);
    const {
      amountOut: amountOut2,
      quotedAmountOut: quotedAmountOut2,
      balancesChange: balancesChange2,
    } = await swapExactInputSwaprRouter(amountIn, tokenIn, tokenOut);
    // Assertions
    expect(balancesChange1.tokenIn).to.equal(amountIn, "Assert spent all tokenIn 1");
    expect(balancesChange2.tokenIn).to.equal(amountIn, "Assert spent all tokenIn 2");
    expect(quotedAmountOut1).to.equal(amountOut1, "Assert same quote and amountOut1");
    expect(quotedAmountOut2).to.equal(amountOut2, "Assert same quote and amountOut2");

    if (tokenInAddress === sDAIAddress || tokenOutAddress === sDAIAddress) {
      expect(quotedAmountOut1).to.equal(quotedAmountOut2, "Assert same quote out");
      expect(amountOut1).to.equal(amountOut2, "Assert amountOut");
      expect(balancesChange1.tokenOut).to.equal(balancesChange2.tokenOut);
    } else {
      expect(quotedAmountOut1).to.be.gt(quotedAmountOut2, "Assert better quote out");
      expect(amountOut1).to.be.gt(amountOut2, "Assert amountOut");
      expect(balancesChange1.tokenOut).to.be.gt(balancesChange2.tokenOut, "Assert tokenOut balances");
    }
  }

  async function swapExactOutputSwaprSavingsXDAIRouter(
    amountOut: bigint,
    amountInMaximum: bigint,
    tokenIn: IERC20 | typeof xDAI,
    tokenOut: IERC20 | typeof xDAI,
    msgValue?: bigint,
  ) {
    await reset();
    const initialBalances = await getBalances(tokenIn, tokenOut, signer.address);
    const tokenInAddress = tokenIn === xDAI ? xDAI : await tokenIn.getAddress();
    const tokenOutAddress = tokenOut === xDAI ? xDAI : await tokenOut.getAddress();
    // Approve tokens if needed
    if (tokenIn !== xDAI) {
      await (tokenIn as IERC20).approve(await swaprSXDaiRouter.getAddress(), amountInMaximum);
      await (tokenIn as IERC20).approve(swaprRouterAddress, amountInMaximum);
    }

    const params = {
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      recipient: signer.address,
      deadline: Math.floor(Date.now() / 1000) + 3600,
      amountOut: amountOut,
      amountInMaximum: amountInMaximum,
      limitSqrtPrice: 0n,
      fee: 3000,
    };

    // SwaprSavingsXDaiRouter swap
    const [quotedAmountIn] = await swaprSXDaiRouter.quoteExactOutputSingle.staticCall(
      params.tokenIn,
      params.tokenOut,
      amountOut,
      0n,
    );
    let amountIn;
    let tx;
    if (tokenIn === xDAI) {
      amountIn = await swaprSXDaiRouter.exactOutputSingle.staticCall(params, { value: msgValue ?? amountInMaximum });
      tx = await swaprSXDaiRouter.exactOutputSingle(params, { value: msgValue ?? amountInMaximum });
    } else {
      amountIn = await swaprSXDaiRouter.exactOutputSingle.staticCall(params);
      tx = await swaprSXDaiRouter.exactOutputSingle(params);
    }
    const receipt = await tx.wait();
    const { gasPrice = 0n, gasUsed = 0n } = receipt ?? {};
    const balancesChange = await getBalancesChange(
      tokenIn,
      initialBalances.tokenIn,
      tokenOut,
      initialBalances.tokenOut,
      signer.address,
      gasPrice * gasUsed,
    );
    return { quotedAmountIn, amountIn, balancesChange };
  }

  async function swapExactOutputSwaprRouter(
    amountOut: bigint,
    amountInMaximum: bigint,
    tokenIn: IERC20 | typeof xDAI,
    tokenOut: IERC20 | typeof xDAI,
  ) {
    await reset();
    const initialBalances = await getBalances(tokenIn, tokenOut, signer.address);
    const tokenInAddress = tokenIn === xDAI ? xDAI : await tokenIn.getAddress();
    const tokenOutAddress = tokenOut === xDAI ? xDAI : await tokenOut.getAddress();
    // Approve tokens if needed
    if (tokenIn !== xDAI) {
      await (tokenIn as IERC20).approve(await swaprSXDaiRouter.getAddress(), amountInMaximum);
      await (tokenIn as IERC20).approve(swaprRouterAddress, amountInMaximum);
    }

    const params = {
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      recipient: signer.address,
      deadline: Math.floor(Date.now() / 1000) + 3600,
      amountOut: amountOut,
      amountInMaximum,
      limitSqrtPrice: 0n,
      fee: 3000,
    };

    const path = ethers.solidityPacked(
      ["address", "address", "address"],
      [
        tokenOutAddress === xDAI ? wxDAIAddress : tokenOutAddress,
        sDAIAddress,
        tokenInAddress === xDAI ? wxDAIAddress : tokenInAddress,
      ],
    );
    const exactOutputParams = {
      path,
      recipient: signer.address,
      deadline: Math.floor(Date.now() / 1000) + 3600,
      amountOut,
      amountInMaximum,
    };
    let quotedAmountIn;
    let tx;
    if (tokenInAddress === sDAIAddress || tokenOutAddress === sDAIAddress) {
      [quotedAmountIn] = await swaprQuoter.quoteExactOutputSingle.staticCall(
        params.tokenIn,
        params.tokenOut,
        amountOut,
        0n,
      );
    } else {
      [quotedAmountIn] = await swaprQuoter.quoteExactOutput.staticCall(path, amountOut);
    }
    let amountIn;
    if (tokenInAddress === sDAIAddress || tokenOutAddress === sDAIAddress) {
      amountIn = await swaprRouter.exactOutputSingle.staticCall(params);
      tx = await swaprRouter.exactOutputSingle(params);
    } else {
      if (tokenInAddress === xDAI) {
        amountIn = await swaprRouter.exactOutput.staticCall(exactOutputParams, { value: amountInMaximum });
        tx = await swaprRouter.exactOutput(exactOutputParams, { value: amountInMaximum });
      } else {
        amountIn = await swaprRouter.exactOutput.staticCall(exactOutputParams);
        tx = await swaprRouter.exactOutput(exactOutputParams);
      }
    }
    const receipt = await tx.wait();
    const { gasPrice = 0n, gasUsed = 0n } = receipt ?? {};
    const balancesChange = await getBalancesChange(
      tokenIn,
      initialBalances.tokenIn,
      tokenOut,
      initialBalances.tokenOut,
      signer.address,
      gasPrice * gasUsed,
    );
    return { amountIn, quotedAmountIn, balancesChange };
  }

  async function assertSwapExactOutputSingle(
    amountOut: bigint,
    amountInMaximum: bigint,
    tokenIn: IERC20 | typeof xDAI,
    tokenOut: IERC20 | typeof xDAI,
  ) {
    const tokenInAddress = tokenIn === xDAI ? xDAI : await tokenIn.getAddress();
    const tokenOutAddress = tokenOut === xDAI ? xDAI : await tokenOut.getAddress();
    const {
      amountIn: amountIn1,
      quotedAmountIn: quotedAmountIn1,
      balancesChange: balancesChange1,
    } = await swapExactOutputSwaprSavingsXDAIRouter(amountOut, amountInMaximum, tokenIn, tokenOut);
    const {
      amountIn: amountIn2,
      quotedAmountIn: quotedAmountIn2,
      balancesChange: balancesChange2,
    } = await swapExactOutputSwaprRouter(amountOut, amountInMaximum, tokenIn, tokenOut);
    // Assertions
    expect(quotedAmountIn1).to.be.approximately(amountIn1, 10n, "Assert same quote and amountIn1");
    expect(quotedAmountIn2).to.equal(amountIn2, "Assert same quote and amountIn2");

    if (tokenInAddress === sDAIAddress || tokenOutAddress === sDAIAddress) {
      expect(quotedAmountIn1).to.equal(quotedAmountIn2, "Assert same quote in");
      expect(amountIn1).to.equal(amountIn2, "Assert amountIn");
      expect(balancesChange1.tokenIn).to.equal(balancesChange2.tokenIn, "Assert same tokenIn change");
      expect(balancesChange1.tokenOut).to.equal(balancesChange2.tokenOut, "Assert same tokenOut change");
    } else {
      expect(quotedAmountIn1).to.be.lt(quotedAmountIn2, "Assert better quote in");
      expect(amountIn1).to.be.lt(amountIn2, "Assert amountIn");
      expect(balancesChange1.tokenIn).to.be.lt(balancesChange2.tokenIn, "Assert tokenIn balances");

      // swaprRouter does not convert wxDAI -> xDAI so we skip
      if (tokenOut !== xDAI) {
        expect(balancesChange1.tokenOut).to.be.approximately(balancesChange2.tokenOut, 10n, "Assert tokenOut balances");
      }
    }
  }

  describe("Exact Input Single", function () {
    it("swaps wxDAI to OUTCOME_TOKEN", async function () {
      // we want to test amountIn close to max sDAI in sDAI/wxDAI liquidity pool
      const amountIn = ethers.parseEther("1500");
      await assertSwapExactInputSingle(amountIn, wxDAI, outcomeToken);
    });

    it("swaps sDAI to OUTCOME_TOKEN", async function () {
      // we want to test amountIn close to max sDAI in sDAI/wxDAI liquidity pool
      const amountIn = ethers.parseEther("1500");
      await assertSwapExactInputSingle(amountIn, sDAI, outcomeToken);
    });

    it("swaps xDAI to OUTCOME_TOKEN", async function () {
      // we want to test amountIn close to max sDAI in sDAI/wxDAI liquidity pool
      const amountIn = ethers.parseEther("1500");
      await assertSwapExactInputSingle(amountIn, xDAI, outcomeToken);
    });

    it("swaps OUTCOME_TOKEN to wxDAI", async function () {
      // we want to test amountIn close to max wxDAI in sDAI/wxDAI liquidity pool
      const amountIn = ethers.parseEther("2500");
      await assertSwapExactInputSingle(amountIn, outcomeToken, wxDAI);
    });

    it("swaps OUTCOME_TOKEN to sDAI", async function () {
      // we want to test amountIn close to max wxDAI in sDAI/wxDAI liquidity pool
      const amountIn = ethers.parseEther("2500");
      await assertSwapExactInputSingle(amountIn, outcomeToken, sDAI);
    });

    it("swaps OUTCOME_TOKEN to xDAI", async function () {
      // we want to test amountIn close to max wxDAI in sDAI/wxDAI liquidity pool
      const amountIn = ethers.parseEther("2500");
      await assertSwapExactInputSingle(amountIn, outcomeToken, xDAI);
    });
  });

  describe("Exact Output Single", function () {
    it("swaps wxDAI to OUTCOME_TOKEN", async function () {
      /// we want to test amountOut close to max sDAI in sDAI/wxDAI liquidity pool
      const amountOut = ethers.parseEther("1500");
      const amountInMaximum = ethers.parseEther("2000");
      await assertSwapExactOutputSingle(amountOut, amountInMaximum, wxDAI, outcomeToken);
    });

    it("swaps sDAI to OUTCOME_TOKEN", async function () {
      /// we want to test amountOut close to max sDAI in sDAI/wxDAI liquidity pool
      const amountOut = ethers.parseEther("1500");
      const amountInMaximum = ethers.parseEther("2000");
      await assertSwapExactOutputSingle(amountOut, amountInMaximum, sDAI, outcomeToken);
    });

    it("swaps xDAI to OUTCOME_TOKEN", async function () {
      /// we want to test amountOut close to max sDAI in sDAI/wxDAI liquidity pool
      const amountOut = ethers.parseEther("1500");
      const amountInMaximum = ethers.parseEther("2000");
      await assertSwapExactOutputSingle(amountOut, amountInMaximum, xDAI, outcomeToken);
    });

    it("swaps OUTCOME_TOKEN to wxDAI", async function () {
      /// we want to test amountOut close to max wxDAI in sDAI/wxDAI liquidity pool
      const amountOut = ethers.parseEther("2500");
      const amountInMaximum = ethers.parseEther("4000");
      await assertSwapExactOutputSingle(amountOut, amountInMaximum, outcomeToken, wxDAI);
    });

    it("swaps OUTCOME_TOKEN to sDAI", async function () {
      const amountOut = ethers.parseEther("2500");
      const amountInMaximum = ethers.parseEther("4000");
      await assertSwapExactOutputSingle(amountOut, amountInMaximum, outcomeToken, sDAI);
    });

    it("swaps OUTCOME_TOKEN to xDAI", async function () {
      const amountOut = ethers.parseEther("2500");
      const amountInMaximum = ethers.parseEther("4000");
      await assertSwapExactOutputSingle(amountOut, amountInMaximum, outcomeToken, xDAI);
    });
  });
});

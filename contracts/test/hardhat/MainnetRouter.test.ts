import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import {
  ConditionalTokens,
  IERC20,
  ISavingsDaiTest,
  MainnetRouter,
  MarketFactory,
  RealityETH_v3_0,
  RealityProxy,
} from "../../typechain-types";
import {
  categoricalMarketParams,
  DELTA,
  ETH_BALANCE,
  MainnetAddress,
  MERGE_AMOUNT,
  MIN_BOND,
  OPENING_TS,
  QUESTION_TIMEOUT,
  SPLIT_AMOUNT,
} from "./helpers/constants";
import { marketFactoryDeployFixture } from "./helpers/fixtures";
import { getRedeemAmounts } from "./helpers/utils";

describe("MainnetRouter", function () {
  let marketFactory: MarketFactory;
  let conditionalTokens: ConditionalTokens;
  let realityProxy: RealityProxy;
  let mainnetRouter: MainnetRouter;
  let realitio: RealityETH_v3_0;
  let DAI: IERC20;
  let sDAI: ISavingsDaiTest;
  let owner: HardhatEthersSigner;

  async function createMarketAndSplitPosition() {
    // first need to create a market to create outcome tokens
    const currentBlockTime = await time.latest();
    await marketFactory.createCategoricalMarket({
      ...categoricalMarketParams,
      openingTime: currentBlockTime + OPENING_TS,
    });
    const outcomeSlotCount = categoricalMarketParams.outcomes.length + 1;
    const marketAddress = (await marketFactory.allMarkets())[0];
    const market = await ethers.getContractAt("Market", marketAddress);
    const questionId = await market.questionId();
    const questionsIds = await market.questionsIds();
    const oracleAddress = await realityProxy.getAddress();
    const conditionId = await conditionalTokens.getConditionId(oracleAddress, questionId, outcomeSlotCount);
    // approve mainnetRouter to transfer user token to the contract
    await DAI.approve(mainnetRouter, ethers.parseEther(SPLIT_AMOUNT));
    // split collateral token to outcome tokens
    await mainnetRouter.splitFromDai(market, ethers.parseEther(SPLIT_AMOUNT));
    return { outcomeSlotCount, conditionId, questionsIds, market };
  }

  beforeEach(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: MainnetAddress.RPC_URL,
          },
        },
      ],
    });
    await network.provider.send("evm_setAutomine", [true]);
    // impersonate an address with many dais
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [MainnetAddress.WHALE],
    });

    owner = await ethers.getSigner(MainnetAddress.WHALE);
    DAI = (await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      MainnetAddress.DAI,
    )) as unknown as IERC20;
    sDAI = await ethers.getContractAt("ISavingsDaiTest", MainnetAddress.S_DAI);
    const sDAIMarketFactoryDeployFixture = async () => marketFactoryDeployFixture(sDAI);
    const {
      marketFactory: _marketFactory,
      conditionalTokens: _conditionalTokens,
      realityProxy: _realityProxy,
      wrapped1155Factory: _wrapped1155Factory,
      realitio: _realitio,
    } = await loadFixture(sDAIMarketFactoryDeployFixture);

    marketFactory = _marketFactory;
    conditionalTokens = _conditionalTokens;
    realityProxy = _realityProxy;
    realitio = _realitio;

    mainnetRouter = await (
      await ethers.getContractFactory("MainnetRouter")
    ).deploy(conditionalTokens, _wrapped1155Factory);

    // connect all contracts to the whale
    marketFactory = marketFactory.connect(owner);
    conditionalTokens = conditionalTokens.connect(owner);
    realityProxy = realityProxy.connect(owner);
    mainnetRouter = mainnetRouter.connect(owner);
    realitio = realitio.connect(owner);
    DAI = DAI.connect(owner);
    sDAI = sDAI.connect(owner);

    // add some eth to the whale
    await network.provider.send("hardhat_setBalance", [
      MainnetAddress.WHALE,
      ethers.toBeHex(ethers.parseEther(ETH_BALANCE)),
    ]);
  });

  afterEach(async function () {
    await network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [MainnetAddress.WHALE],
    });
  });

  describe("splitPosition", function () {
    it("splits position and send outcome tokens to user", async function () {
      const { outcomeSlotCount, market } = await createMarketAndSplitPosition();
      const amountInSDai = await sDAI.convertToShares(ethers.parseEther(SPLIT_AMOUNT));
      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);

        expect(await token.balanceOf(owner)).to.be.closeTo(amountInSDai, DELTA);
      }
      expect(await sDAI.balanceOf(conditionalTokens)).to.be.closeTo(amountInSDai, DELTA);
    });
  });
  describe("mergePositions", function () {
    it("merges positions and send collateral tokens to user", async function () {
      // split first
      const { outcomeSlotCount, market } = await createMarketAndSplitPosition();
      const splitAmountInSDai = await sDAI.convertToShares(ethers.parseEther(SPLIT_AMOUNT));
      const mergeAmountInSDai = await sDAI.convertToShares(ethers.parseEther(MERGE_AMOUNT));

      // allow mainnetRouter to transfer position tokens to the contract
      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);

        // approve some more for the fluctuation of exchange rate
        await token.connect(owner).approve(mainnetRouter, ethers.parseEther(SPLIT_AMOUNT));
      }
      const balanceBeforeMerge = await DAI.balanceOf(owner);

      // merge positions
      await mainnetRouter.mergeToDai(market, mergeAmountInSDai);

      const balanceAfterMerge = await DAI.balanceOf(owner);

      expect(balanceBeforeMerge + (await sDAI.convertToAssets(mergeAmountInSDai))).to.be.closeTo(
        balanceAfterMerge,
        DELTA,
      );

      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);
        expect(await token.balanceOf(owner)).to.be.closeTo(splitAmountInSDai - mergeAmountInSDai, DELTA);
      }
      expect(await sDAI.balanceOf(conditionalTokens)).to.be.closeTo(splitAmountInSDai - mergeAmountInSDai, DELTA);
    });
  });

  describe("redeemPositions", function () {
    it("redeems a winning position and send collateral tokens to user", async function () {
      const ANSWER = 1;
      const REDEEMED_POSITION = 1;
      // split first
      const { outcomeSlotCount, conditionId, questionsIds, market } = await createMarketAndSplitPosition();
      const amountInSDai = await sDAI.convertToShares(ethers.parseEther(SPLIT_AMOUNT));
      // answer the question and resolve the market
      // past opening_ts
      await time.increase(OPENING_TS);

      // submit answer
      await realitio.submitAnswer(questionsIds[0], ethers.toBeHex(BigInt(ANSWER), 32), 0, {
        value: ethers.parseEther(MIN_BOND),
      });

      // past finalized_ts
      await time.increase(QUESTION_TIMEOUT);

      await realityProxy.resolve(market);

      // allow mainnetRouter to transfer position tokens to the contract
      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);

        await token.connect(owner).approve(mainnetRouter, ethers.parseEther(SPLIT_AMOUNT));
      }
      const balanceBeforeRedeem = await DAI.balanceOf(owner);
      // redeem winning position
      await mainnetRouter.redeemToDai(market, [REDEEMED_POSITION], getRedeemAmounts(outcomeSlotCount, amountInSDai));

      const balanceAfterRedeem = await DAI.balanceOf(owner);

      expect(balanceBeforeRedeem + (await sDAI.convertToAssets(amountInSDai))).to.be.closeTo(balanceAfterRedeem, DELTA);

      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);
        if (i === REDEEMED_POSITION) {
          expect(await token.balanceOf(owner)).to.be.closeTo("0", DELTA);
        } else {
          expect(await token.balanceOf(owner)).to.be.closeTo(amountInSDai, DELTA);
        }
      }
      expect(await sDAI.balanceOf(conditionalTokens)).to.be.closeTo("0", DELTA);

      const winningOutcomes = await mainnetRouter.getWinningOutcomes(conditionId);
      expect(winningOutcomes[ANSWER]).to.equal(true);
    });

    it("redeems a losing position", async function () {
      const ANSWER = 1;
      const REDEEMED_POSITION = 0;

      // split first
      const { outcomeSlotCount, questionsIds, market } = await createMarketAndSplitPosition();
      const amountInSDai = await sDAI.convertToShares(ethers.parseEther(SPLIT_AMOUNT));
      // answer the question and resolve the market
      // past opening_ts
      await time.increase(OPENING_TS);
      // submit answer
      await realitio.submitAnswer(questionsIds[0], ethers.toBeHex(BigInt(ANSWER), 32), 0, {
        value: ethers.parseEther(MIN_BOND),
      });

      // past finalized_ts
      await time.increase(QUESTION_TIMEOUT);

      await realityProxy.resolve(market);

      // allow mainnetRouter to transfer position tokens to the contract
      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);

        await token.connect(owner).approve(mainnetRouter, ethers.parseEther(SPLIT_AMOUNT));
      }

      const balanceBeforeRedeem = await DAI.balanceOf(owner);
      // redeem losing position
      await mainnetRouter.redeemToDai(market, [REDEEMED_POSITION], getRedeemAmounts(outcomeSlotCount, amountInSDai));

      const balanceAfterRedeem = await DAI.balanceOf(owner);

      expect(balanceBeforeRedeem).to.equal(balanceAfterRedeem);

      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);
        if (i === REDEEMED_POSITION) {
          expect(await token.balanceOf(owner)).to.be.closeTo("0", DELTA);
        } else {
          expect(await token.balanceOf(owner)).to.be.closeTo(amountInSDai, DELTA);
        }
      }
      expect(await sDAI.balanceOf(conditionalTokens)).to.be.closeTo(amountInSDai, DELTA);
    });
  });
});

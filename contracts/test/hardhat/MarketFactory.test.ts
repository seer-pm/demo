import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { ConditionalTokens, MarketFactory, RealityETH_v3_0, Wrapped1155Factory } from "../../typechain-types";
import {
  ETH_BALANCE,
  MIN_BOND,
  OPENING_TS,
  QUESTION_TIMEOUT,
  REALITY_SINGLE_SELECT_TEMPLATE,
  SHORT_QUESTION_TIMEOUT,
  type MarketParams,
} from "./helpers/constants";
import { marketFactoryDeployFixture } from "./helpers/fixtures";

describe("MarketFactory", function () {
  let marketFactory: MarketFactory;
  let realitio: RealityETH_v3_0;
  let arbitrator: string;
  let conditionalTokens: ConditionalTokens;
  let wrapped1155Factory: Wrapped1155Factory;

  let categoricalMarketParams: MarketParams;
  let multiCategoricalMarketParams: MarketParams;
  let scalarMarketParams: MarketParams;
  let multiScalarMarketParams: MarketParams;

  beforeEach(async function () {
    await network.provider.send("evm_setAutomine", [true]);
    const {
      marketFactory: _marketFactory,
      realitio: _realitio,
      arbitrator: _arbitrator,
      conditionalTokens: _conditionalTokens,
      wrapped1155Factory: _wrapped1155Factory,
      marketParams: _marketParams,
    } = await loadFixture(marketFactoryDeployFixture);
    conditionalTokens = _conditionalTokens;
    wrapped1155Factory = _wrapped1155Factory;
    categoricalMarketParams = _marketParams.categoricalMarketParams;
    multiCategoricalMarketParams = _marketParams.multiCategoricalMarketParams;
    scalarMarketParams = _marketParams.scalarMarketParams;
    multiScalarMarketParams = _marketParams.multiScalarMarketParams;

    marketFactory = _marketFactory;
    realitio = _realitio;
    arbitrator = _arbitrator;
  });

  describe("createCategoricalMarket", function () {
    it("reverts if less than 2 outcomes", async function () {
      await expect(
        marketFactory.createCategoricalMarket({
          ...categoricalMarketParams,
          outcomes: ["1"],
        })
      ).to.be.revertedWith("Outcomes count must be 2 or more");
    });
    it("reverts if some tokenName is empty", async function () {
      await expect(
        marketFactory.createCategoricalMarket({
          ...categoricalMarketParams,
          tokenNames: ["A", ""],
        })
      ).to.reverted;
    });
    it("does not create a new realitio question if existed", async function () {
      const marketFactoryAddress = await marketFactory.getAddress();
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [marketFactoryAddress],
      });
      await network.provider.send("hardhat_setBalance", [
        marketFactoryAddress,
        ethers.toBeHex(ethers.parseEther(ETH_BALANCE)),
      ]);
      const marketFactorySigner = await ethers.getSigner(marketFactoryAddress);
      const trx = await realitio
        .connect(marketFactorySigner)
        .askQuestionWithMinBond(
          REALITY_SINGLE_SELECT_TEMPLATE,
          categoricalMarketParams.encodedQuestions[0],
          arbitrator,
          QUESTION_TIMEOUT,
          categoricalMarketParams.openingTime,
          0,
          ethers.parseEther(MIN_BOND)
        );
      const receipt = await trx.wait(1);
      const events = await realitio.queryFilter(
        realitio.filters.LogNewQuestion,
        receipt?.blockNumber
      );
      await network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [marketFactoryAddress],
      });
      const questionId = events[0].args[0];
      await marketFactory.createCategoricalMarket(categoricalMarketParams);
      const marketAddress = (await marketFactory.allMarkets())[0];
      const market = await ethers.getContractAt("Market", marketAddress);
      expect(questionId).to.equal((await market.questionsIds())[0]);
    });
    it("creates a categorical market", async function () {
      await expect(
        marketFactory.createCategoricalMarket(categoricalMarketParams)
      )
        .to.emit(marketFactory, "NewMarket")
        .withArgs(
          ethers.isAddress,
          categoricalMarketParams.marketName,
          ethers.ZeroAddress,
          ethers.isHexString,
          ethers.isHexString,
          [ethers.isHexString]
        );
      const marketCount = Number(await marketFactory.marketCount());
      expect(marketCount).to.equal(1);
    });
  });

  describe("createMultiCategoricalMarket", function () {
    it("reverts if less than 2 outcomes", async function () {
      await expect(
        marketFactory.createMultiCategoricalMarket({
          ...multiCategoricalMarketParams,
          outcomes: ["1"],
        })
      ).to.be.revertedWith("Outcomes count must be 2 or more");
    });
    it("creates a multi-categorical market", async function () {
      await expect(
        marketFactory.createMultiCategoricalMarket(multiCategoricalMarketParams)
      )
        .to.emit(marketFactory, "NewMarket")
        .withArgs(
          ethers.isAddress,
          multiCategoricalMarketParams.marketName,
          ethers.ZeroAddress,
          ethers.isHexString,
          ethers.isHexString,
          [ethers.isHexString]
        );

      const marketCount = Number(await marketFactory.marketCount());
      expect(marketCount).to.equal(1);
    });
  });

  describe("createScalarMarket", function () {
    it("reverts if lowerBound is higher then upperBound", async function () {
      await expect(
        marketFactory.createScalarMarket({
          ...scalarMarketParams,
          upperBound: 0,
          lowerBound: 10,
        })
      ).to.be.revertedWith("upperBound must be higher than lowerBound");
    });
    it("reverts if upper bound is higher than type(uint256).max - 2", async function () {
      await expect(
        marketFactory.createScalarMarket({
          ...scalarMarketParams,
          upperBound: ethers.MaxUint256,
        })
      ).to.be.revertedWith("upperBound must be less than uint256.max - 2");
    });
    it("reverts if less than 2 outcomes", async function () {
      await expect(
        marketFactory.createScalarMarket({
          ...scalarMarketParams,
          outcomes: ["1"],
        })
      ).to.be.revertedWith("Outcomes count must be 2");
    });
    it("reverts if more than 2 outcomes", async function () {
      await expect(
        marketFactory.createScalarMarket({
          ...scalarMarketParams,
          outcomes: ["1", "2", "3"],
        })
      ).to.be.revertedWith("Outcomes count must be 2");
    });
    it("creates a scalar market", async function () {
      await expect(marketFactory.createScalarMarket(scalarMarketParams))
        .to.emit(marketFactory, "NewMarket")
        .withArgs(
          ethers.isAddress,
          scalarMarketParams.marketName,
          ethers.ZeroAddress,
          ethers.isHexString,
          ethers.isHexString,
          [ethers.isHexString]
        );

      const marketCount = Number(await marketFactory.marketCount());
      expect(marketCount).to.equal(1);
    });
  });

  describe("createMultiScalarMarket", function () {
    it("reverts if outcomes length is less than 2", async function () {
      await expect(
        marketFactory.createMultiScalarMarket({
          ...multiScalarMarketParams,
          outcomes: ["1"],
        })
      ).to.be.revertedWith("Outcomes count must be 2 or more");
    });
    it("creates a multi-scalar market", async function () {
      await expect(
        marketFactory.createMultiScalarMarket(multiScalarMarketParams)
      )
        .to.emit(marketFactory, "NewMarket")
        .withArgs(
          ethers.isAddress,
          multiScalarMarketParams.marketName,
          ethers.ZeroAddress,
          ethers.isHexString,
          ethers.isHexString,
          multiScalarMarketParams.encodedQuestions.map(
            () => ethers.isHexString
          )
        );

      const marketCount = Number(await marketFactory.marketCount());
      expect(marketCount).to.equal(1);
    });
    it("creates multiple multi-scalar markets", async function () {
      const MARKET_COUNT = 3;
      for (let i = 0; i < MARKET_COUNT; i++) {
        await marketFactory.createMultiScalarMarket({
          ...multiScalarMarketParams,
          openingTime: (await time.latest()) + OPENING_TS,
        });
      }
      expect(await marketFactory.marketCount()).to.equal(MARKET_COUNT);
    });
    it("allows to create multiple multi-scalar markets with same params", async function () {
      await marketFactory.createMultiScalarMarket(multiScalarMarketParams);
      await marketFactory.createMultiScalarMarket(multiScalarMarketParams);
    });
  });

  describe("collateral and timeout", function () {
    async function createCategoricalMarket(params: Parameters<MarketFactory["createCategoricalMarket"]>[0]) {
      const marketAddress = await marketFactory.createCategoricalMarket.staticCall(params);
      await marketFactory.createCategoricalMarket(params);
      return ethers.getContractAt("Market", marketAddress);
    }

    it("reverts without a collateral token", async function () {
      await expect(
        marketFactory.createCategoricalMarket({ ...categoricalMarketParams, collateralToken: ethers.ZeroAddress })
      ).to.be.revertedWith("Missing collateral token");
    });

    it("leaves the timeout bounds to Reality", async function () {
      await expect(
        marketFactory.createCategoricalMarket({ ...categoricalMarketParams, questionTimeout: 0 })
      ).to.be.revertedWith("timeout must be positive");
    });

    it("asks the Reality question with the market's timeout", async function () {
      const market = await createCategoricalMarket({
        ...categoricalMarketParams,
        questionTimeout: SHORT_QUESTION_TIMEOUT,
      });
      const [questionId] = await market.questionsIds();
      expect(await realitio.getTimeout(questionId)).to.equal(SHORT_QUESTION_TIMEOUT);
    });

    it("asks a different question for each timeout", async function () {
      const slow = await createCategoricalMarket(categoricalMarketParams);
      const fast = await createCategoricalMarket({ ...categoricalMarketParams, questionTimeout: SHORT_QUESTION_TIMEOUT });
      const same = await createCategoricalMarket({ ...categoricalMarketParams, questionTimeout: SHORT_QUESTION_TIMEOUT });

      expect((await slow.questionsIds())[0]).to.not.equal((await fast.questionsIds())[0]);
      expect((await fast.questionsIds())[0]).to.equal((await same.questionsIds())[0]);
      expect(await slow.conditionId()).to.not.equal(await fast.conditionId());
    });

    it("stores the collateral token on the market and uses it for the outcome tokens", async function () {
      const collateral = await ethers.deployContract("CollateralToken");
      const collateralAddress = await collateral.getAddress();
      const market = await createCategoricalMarket({ ...categoricalMarketParams, collateralToken: collateralAddress });

      expect(await market.collateralToken()).to.equal(collateralAddress);

      const collectionId = await conditionalTokens.getCollectionId(ethers.ZeroHash, await market.conditionId(), 1);
      const positionId = await conditionalTokens.getPositionId(collateralAddress, collectionId);
      const [wrapped1155, data] = await market.wrappedOutcome(0);
      expect(
        await wrapped1155Factory.getWrapped1155(await conditionalTokens.getAddress(), positionId, data)
      ).to.equal(wrapped1155);
    });

    it("deploys outcome tokens with the collateral's decimals", async function () {
      const collateral = await ethers.deployContract("CollateralToken6");
      const market = await createCategoricalMarket({
        ...categoricalMarketParams,
        collateralToken: await collateral.getAddress(),
      });
      const [wrapped1155, data] = await market.wrappedOutcome(0);
      const token = await ethers.getContractAt("Wrapped1155", wrapped1155);

      expect(await token.decimals()).to.equal(6);
      // the decimals byte closes the token data
      expect(Number.parseInt(data.slice(-2), 16)).to.equal(6);
    });

    it("reverts when the collateral has no decimals", async function () {
      const collateral = await ethers.deployContract("CollateralTokenNoDecimals");
      await expect(
        marketFactory.createCategoricalMarket({
          ...categoricalMarketParams,
          collateralToken: await collateral.getAddress(),
        })
      ).to.be.reverted;
    });

    it("reverts if a conditional market does not use the parent's collateral", async function () {
      const parent = await createCategoricalMarket(categoricalMarketParams);
      const otherCollateral = await ethers.deployContract("CollateralToken");

      await expect(
        marketFactory.createScalarMarket({
          ...scalarMarketParams,
          parentMarket: await parent.getAddress(),
          parentOutcome: 1,
          collateralToken: await otherCollateral.getAddress(),
        })
      ).to.be.revertedWith("Collateral must match the parent market");
    });

    it("creates a conditional market with the parent's collateral", async function () {
      const parent = await createCategoricalMarket(categoricalMarketParams);
      const marketAddress = await marketFactory.createScalarMarket.staticCall({
        ...scalarMarketParams,
        parentMarket: await parent.getAddress(),
        parentOutcome: 1,
      });
      await marketFactory.createScalarMarket({
        ...scalarMarketParams,
        parentMarket: await parent.getAddress(),
        parentOutcome: 1,
      });
      const child = await ethers.getContractAt("Market", marketAddress);

      expect(await child.collateralToken()).to.equal(categoricalMarketParams.collateralToken);
      const [parentWrapped] = await child.parentWrappedOutcome();
      const [expectedWrapped] = await parent.wrappedOutcome(1);
      expect(parentWrapped).to.equal(expectedWrapped);
    });
  });

  describe("allMarkets", function () {
    it("returns all markets", async function () {
      await marketFactory.createCategoricalMarket(categoricalMarketParams);
      await marketFactory.createMultiCategoricalMarket(
        multiCategoricalMarketParams
      );
      await marketFactory.createScalarMarket(scalarMarketParams);

      const markets = await marketFactory.allMarkets();

      expect(markets.length).to.equal(3);
    });
  });
});

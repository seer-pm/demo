import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { MarketFactory, RealityETH_v3_0 } from "../../typechain-types";
import {
  ETH_BALANCE,
  MIN_BOND,
  OPENING_TS,
  QUESTION_TIMEOUT,
  REALITY_SINGLE_SELECT_TEMPLATE,
  categoricalMarketParams,
  multiCategoricalMarketParams,
  multiScalarMarketParams,
  scalarMarketParams,
} from "./helpers/constants";
import { marketFactoryDeployFixture } from "./helpers/fixtures";

describe("MarketFactory", function () {
  let marketFactory: MarketFactory;
  let realitio: RealityETH_v3_0;
  let arbitrator: string;

  beforeEach(async function () {
    await network.provider.send("evm_setAutomine", [true]);
    const {
      marketFactory: _marketFactory,
      realitio: _realitio,
      arbitrator: _arbitrator,
    } = await loadFixture(marketFactoryDeployFixture);

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
      ).to.be.revertedWith("Invalid outcomes count");
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
      expect(questionId).to.equal(await market.questionId());
    });
    it("creates a categorical market", async function () {
      await expect(
        marketFactory.createCategoricalMarket(categoricalMarketParams)
      )
        .to.emit(marketFactory, "NewMarket")
        .withArgs(
          ethers.isAddress,
          categoricalMarketParams.marketName,
          categoricalMarketParams.outcomes,
          categoricalMarketParams.lowerBound,
          categoricalMarketParams.upperBound,
          ethers.isHexString,
          ethers.isHexString,
          [ethers.isHexString],
          ethers.getBigInt(2),
          categoricalMarketParams.encodedQuestions
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
      ).to.be.revertedWith("Invalid outcomes count");
    });
    it("creates a multi-categorical market", async function () {
      await expect(
        marketFactory.createMultiCategoricalMarket(multiCategoricalMarketParams)
      )
        .to.emit(marketFactory, "NewMarket")
        .withArgs(
          ethers.isAddress,
          multiCategoricalMarketParams.marketName,
          multiCategoricalMarketParams.outcomes,
          multiCategoricalMarketParams.lowerBound,
          multiCategoricalMarketParams.upperBound,
          ethers.isHexString,
          ethers.isHexString,
          [ethers.isHexString],
          ethers.getBigInt(3),
          multiCategoricalMarketParams.encodedQuestions
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
      ).to.be.revertedWith("Invalid bounds");
    });
    it("reverts if upper bound is higher than type(uint256).max - 2", async function () {
      await expect(
        marketFactory.createScalarMarket({
          ...scalarMarketParams,
          upperBound: ethers.MaxUint256,
        })
      ).to.be.revertedWith("Invalid high point");
    });
    it("reverts if less than 2 outcomes", async function () {
      await expect(
        marketFactory.createScalarMarket({
          ...scalarMarketParams,
          outcomes: ["1"],
        })
      ).to.be.revertedWith("Invalid outcomes count");
    });
    it("reverts if more than 2 outcomes", async function () {
      await expect(
        marketFactory.createScalarMarket({
          ...scalarMarketParams,
          outcomes: ["1", "2", "3"],
        })
      ).to.be.revertedWith("Invalid outcomes count");
    });
    it("creates a scalar market", async function () {
      await expect(marketFactory.createScalarMarket(scalarMarketParams))
        .to.emit(marketFactory, "NewMarket")
        .withArgs(
          ethers.isAddress,
          scalarMarketParams.marketName,
          scalarMarketParams.outcomes,
          scalarMarketParams.lowerBound,
          scalarMarketParams.upperBound,
          ethers.isHexString,
          ethers.isHexString,
          [ethers.isHexString],
          ethers.getBigInt(1),
          scalarMarketParams.encodedQuestions
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
          encodedQuestions: ["1"],
        })
      ).to.be.revertedWith("Invalid outcomes count");
    });
    it("reverts if outcomes length is different from encodedQuestions length", async function () {
      await expect(
        marketFactory.createMultiScalarMarket({
          ...multiScalarMarketParams,
          outcomes: ["1", "2", "3"],
          encodedQuestions: ["1", "2"],
        })
      ).to.be.revertedWith("Length mismatch");
    });
    it("creates a multi-scalar market", async function () {
      await expect(
        marketFactory.createMultiScalarMarket(multiScalarMarketParams)
      )
        .to.emit(marketFactory, "NewMarket")
        .withArgs(
          ethers.isAddress,
          multiScalarMarketParams.marketName,
          multiScalarMarketParams.outcomes,
          multiScalarMarketParams.lowerBound,
          multiScalarMarketParams.upperBound,
          ethers.isHexString,
          ethers.isHexString,
          multiScalarMarketParams.encodedQuestions.map(
            () => ethers.isHexString
          ),
          ethers.getBigInt(1),
          multiScalarMarketParams.encodedQuestions
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
    it("reverts if try to create multiple multi-scalar markets with same params", async function () {
      await marketFactory.createMultiScalarMarket(multiScalarMarketParams);
      await expect(
        marketFactory.createMultiScalarMarket(multiScalarMarketParams)
      ).to.be.reverted;
    });
  });

  describe("changeGovernor", function () {
    it("reverts if not the governor", async function () {
      const [_, addr1] = await ethers.getSigners();
      const newGovernor = ethers.Wallet.createRandom().address;

      await expect(
        marketFactory.connect(addr1).changeGovernor(newGovernor)
      ).to.be.revertedWith("Not authorized");
    });
    it("changes the governor", async function () {
      const newGovernor = ethers.Wallet.createRandom().address;

      await marketFactory.changeGovernor(newGovernor);

      expect(await marketFactory.governor()).to.equal(newGovernor);
    });
  });

  describe("changeMarket", function () {
    it("reverts if not the governor", async function () {
      const [_, addr1] = await ethers.getSigners();
      const newMarket = ethers.Wallet.createRandom().address;

      await expect(
        marketFactory.connect(addr1).changeMarket(newMarket)
      ).to.be.revertedWith("Not authorized");
    });
    it("changes the market", async function () {
      const newMarket = ethers.Wallet.createRandom().address;

      await marketFactory.changeMarket(newMarket);

      expect(await marketFactory.market()).to.equal(newMarket);
    });
  });

  describe("changeRealityProxy", function () {
    it("reverts if not the governor", async function () {
      const [_, addr1] = await ethers.getSigners();
      const newRealityProxy = ethers.Wallet.createRandom().address;

      await expect(
        marketFactory.connect(addr1).changeRealityProxy(newRealityProxy)
      ).to.be.revertedWith("Not authorized");
    });
    it("changes reality proxy", async function () {
      const newRealityProxy = ethers.Wallet.createRandom().address;

      await marketFactory.changeRealityProxy(newRealityProxy);

      expect(await marketFactory.realityProxy()).to.equal(newRealityProxy);
    });
  });

  describe("changeQuestionTimeout", function () {
    it("reverts if not the governor", async function () {
      const [_, addr1] = await ethers.getSigners();
      const newTimeout = 60;
      await expect(
        marketFactory.connect(addr1).changeQuestionTimeout(newTimeout)
      ).to.be.revertedWith("Not authorized");
    });
    it("changes the question timeout", async function () {
      const newTimeout = 60;
      await marketFactory.changeQuestionTimeout(newTimeout);
      expect(await marketFactory.questionTimeout()).to.equal(newTimeout);
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

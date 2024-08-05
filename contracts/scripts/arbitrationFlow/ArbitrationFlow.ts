import { Contract } from "ethers";
import { ethers, network } from "hardhat";
import {
  categoricalMarketParams,
  ETH_BALANCE,
  GnosisAddress,
  MainnetAddress,
  QUESTION_TIMEOUT,
} from "../../test/hardhat/helpers/constants";
import {
  foreignAMBAbi,
  homeAMBAbi,
  homeProxyAbi,
  realitioAbi,
  realitioForeignArbitrationProxyAbi,
  validatorImplementationAbi,
} from "./abis";
import {
  ARBITRATOR,
  createSignaturesBytesBlob,
  FOREIGN_AMB,
  FOREIGN_AMB_PROXY,
  FOREIGN_PROXY,
  foreignProvider,
  HOME_AMB,
  HOME_AMB_PROXY,
  HOME_PROXY,
  homeProvider,
  homeValidatorList,
  REALITIO,
  FOREIGN_VALIDATOR_CONTRACT_OWNER,
  FOREIGN_VALIDATOR_IMPLEMENTATION,
  FOREIGN_VALIDATOR_PROXY,
} from "./utils";

export default class ArbitrationFlow {
  foreignSigner: any;
  foreignProxy: Contract | undefined;
  foreignAmb: Contract | undefined;
  foreignAmbProxy: Contract | undefined;
  homeSigner: any;
  homeProxy: Contract | undefined;
  homeAmb: Contract | undefined;
  homeAmbProxy: Contract | undefined;
  async init() {
    await foreignProvider.send("evm_setAutomine", [true]);
    await homeProvider.send("evm_setAutomine", [true]);

    this.foreignSigner = (await ethers.getSigners())[0].connect(foreignProvider);
    this.foreignProxy = new ethers.Contract(FOREIGN_PROXY, realitioForeignArbitrationProxyAbi, this.foreignSigner);
    this.foreignAmb = new ethers.Contract(FOREIGN_AMB, foreignAMBAbi, this.foreignSigner);
    this.foreignAmbProxy = this.foreignAmb.attach(FOREIGN_AMB_PROXY).connect(this.foreignSigner) as Contract;

    this.homeSigner = (await ethers.getSigners())[0].connect(homeProvider);
    this.homeProxy = new ethers.Contract(HOME_PROXY, homeProxyAbi, this.homeSigner);
    this.homeAmb = new ethers.Contract(HOME_AMB, homeAMBAbi, this.homeSigner);
    this.homeAmbProxy = this.homeAmb.attach(HOME_AMB_PROXY).connect(this.homeSigner) as Contract;
    return this;
  }

  async resetNetworks() {
    await foreignProvider.send("hardhat_reset", [
      {
        forking: {
          jsonRpcUrl: MainnetAddress.RPC_URL,
        },
      },
    ]);
    await homeProvider.send("hardhat_reset", [
      {
        forking: {
          jsonRpcUrl: GnosisAddress.RPC_URL,
        },
      },
    ]);
  }

  async initOptional() {
    this.checkInit();
    // deploy market factory + create a market + ask question
    const questionId = await this.deployMarketFactoryAndCreateMarket();
    const trx = await this.foreignProxy!.requestArbitration(questionId, 0, {
      value: ethers.parseEther("10"),
    });
    const receipt = await trx.wait(1);
    const events = await this.foreignAmbProxy!.queryFilter(
      this.foreignAmbProxy!.filters.UserRequestForAffirmation,
      receipt?.blockNumber,
    );
    const requester = (
      (
        await this.foreignProxy!.queryFilter(this.foreignProxy!.filters.ArbitrationRequested, receipt?.blockNumber)
      )[0] as any
    )?.args?.[1];
    return {
      events,
      requester,
    };
  }

  async receiveArbitrationRequest(transactionId: string) {
    this.checkInit();
    const tx = await foreignProvider.send("eth_getTransactionByHash", [transactionId]);
    const events = await this.foreignAmbProxy!.queryFilter(
      this.foreignAmbProxy!.filters.UserRequestForAffirmation,
      tx.blockNumber,
    );
    const [_, messageData] = (events[0] as any).args;

    // switch to gnosis to receive message and call receiveArbitrationRequest
    await this.executeForeignMessage(messageData);
  }

  async receiveArbitrationAcknowledgement(questionId: string, requester: string) {
    this.checkInit();
    const trx = await this.homeProxy!.handleNotifiedRequest(questionId, requester);
    const receipt = await trx.wait(1);
    const events = await this.homeAmbProxy!.queryFilter(
      this.homeAmbProxy!.filters.UserRequestForSignature,
      receipt?.blockNumber,
    );
    const [_, messageData] = (events[0] as any).args;
    console.log({ messageData, blockNumber: receipt?.blockNumber });
    // switch to mainnet to receive message and call receiveArbitrationAcknowledgement
    await this.executeHomeMessage(messageData);
    const arbitrationCreatedEvent = await this.foreignProxy!.queryFilter(
      this.foreignProxy!.filters.ArbitrationCreated,
      receipt?.blockNumber,
    );
    const disputeId = (arbitrationCreatedEvent[0] as any).args[2];
    return disputeId;
  }
  async rule(disputeId: bigint, ruling: number) {
    this.checkInit();
    await foreignProvider.send("hardhat_impersonateAccount", [ARBITRATOR]);

    const arbitrator = (await ethers.getSigner(ARBITRATOR)).connect(foreignProvider);
    await foreignProvider.send("hardhat_setBalance", [ARBITRATOR, ethers.toBeHex(ethers.parseEther(ETH_BALANCE))]);
    const trx = await (this.foreignProxy!.connect(arbitrator) as any).rule(disputeId, ruling);
    const receipt = await trx.wait(1);
    const events = await this.foreignAmbProxy!.queryFilter(
      this.foreignAmbProxy!.filters.UserRequestForAffirmation,
      receipt?.blockNumber,
    );
    const [_, messageData] = (events[0] as any).args;

    // // switch to gnosis to receive message and call receiveArbitrationAnswer
    await this.executeForeignMessage(messageData);
  }

  async reportArbitrationAnswer(questionId: string, prevHistoryHash: string, lastAnswerer: string) {
    this.checkInit();
    const realitio = new ethers.Contract(REALITIO, realitioAbi, this.homeSigner);
    const question = await realitio.questions(questionId);
    const bestAnswer = question[7];
    await this.homeProxy!.reportArbitrationAnswer(questionId, prevHistoryHash, bestAnswer, lastAnswerer);
  }

  async resolveMarket(address: string) {
    const market = await ethers.getContractAt("Market", address, this.homeSigner);
    await market.resolve();
  }

  async deployMarketFactoryAndCreateMarket() {
    const marketFactory = await (await ethers.getContractFactory("MarketFactory"))
      .connect(this.homeSigner)
      .deploy(
        "0x7EcE7743cc476b4343919B85B2C53AfF50ED3B15",
        "0x29F39dE98D750eb77b5FAfb31B2837f079FcE222",
        "0xE78996A233895bE74a66F451f1019cA9734205cc",
        "0x5bc8ddE5D07C6bf24911240AA6F9B0190ae3b557",
        "0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce",
        "0xaf204776c7245bF4147c2612BF6e5972Ee483701",
        "0x5BE39c00fB89688E8C38732Fb204B084ca5f8965",
        QUESTION_TIMEOUT,
      );
    const realitio = new ethers.Contract("0xE78996A233895bE74a66F451f1019cA9734205cc", realitioAbi, this.homeSigner);
    const trx = await marketFactory.createCategoricalMarket({
      ...categoricalMarketParams,
      minBond: 0,
    });
    const receipt = await trx.wait(1);
    const events = (await marketFactory.queryFilter(marketFactory.filters.NewMarket, receipt?.blockNumber)) as any;
    const questionId = events[0].args[6];
    await realitio.submitAnswer(questionId, "0x0000000000000000000000000000000000000000000000000000000000000001", 0, {
      value: "1000",
    });
    return questionId;
  }

  async executeForeignMessage(messageData: string) {
    this.checkInit();
    let finalTrx;
    for (const homeValidator of homeValidatorList) {
      await homeProvider.send("hardhat_impersonateAccount", [homeValidator]);
      await homeProvider.send("hardhat_setBalance", [homeValidator, ethers.toBeHex(ethers.parseEther(ETH_BALANCE))]);
      const homeSigner = (await ethers.getSigner(homeValidator)).connect(homeProvider);
      // has to call this function for each validator
      finalTrx = await (this.homeAmbProxy!.connect(homeSigner) as Contract).executeAffirmation(messageData);
      await homeProvider.send("hardhat_stopImpersonatingAccount", [homeValidator]);
    }
    return finalTrx;
  }
  async executeHomeMessage(messageData: string) {
    this.checkInit();
    const signatures: string[] = [];

    await foreignProvider.send("hardhat_impersonateAccount", [FOREIGN_VALIDATOR_CONTRACT_OWNER]);
    const validatorContractOwnerSigner = (await ethers.getSigner(FOREIGN_VALIDATOR_CONTRACT_OWNER)).connect(
      foreignProvider,
    );
    const validatorImpl = await ethers.getContractAt(validatorImplementationAbi, FOREIGN_VALIDATOR_IMPLEMENTATION);
    const validatorProxy = validatorImpl
      .attach(FOREIGN_VALIDATOR_PROXY)
      .connect(validatorContractOwnerSigner) as Contract;
    for (let i = 0; i < 4; i++) {
      const newValidator = (await ethers.getSigners())[i].connect(foreignProvider);
      await validatorProxy.addValidator(newValidator);
      const signature = await newValidator.signMessage(ethers.getBytes(messageData));

      signatures.push(signature);
    }

    return await this.foreignAmbProxy!.executeSignatures(messageData, createSignaturesBytesBlob(signatures));
  }

  checkInit() {
    if (
      !this.homeProxy ||
      !this.homeAmbProxy ||
      !this.homeAmb ||
      !this.foreignProxy ||
      !this.foreignAmbProxy ||
      !this.foreignAmb
    ) {
      throw Error("Init first");
    }
  }
}

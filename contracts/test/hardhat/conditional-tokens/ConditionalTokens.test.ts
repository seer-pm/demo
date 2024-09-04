import { ethers, network } from "hardhat";
import { CollateralToken, ConditionalTokens } from "../../../typechain-types";
import { expect } from "chai";
import { getBitMaskDecimal, getConditionId } from "../helpers/utils";
import { ContractTransactionResponse } from "ethers";
import { EMPTY_PARENT_COLLECTION_ID } from "../helpers/constants";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ConditionalTokens", function () {
  let collateralToken: CollateralToken;
  let conditionalTokens: ConditionalTokens;
  let owner: HardhatEthersSigner;
  let oracle: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, oracle] = await ethers.getSigners();
    await network.provider.send("evm_setAutomine", [true]);
    collateralToken = await ethers.deployContract("CollateralToken");
    conditionalTokens = await ethers.deployContract("ConditionalTokens");
  });

  describe("prepareCondition", function () {
    it("is not able to prepare a condition with no outcome slots", async function () {
      const questionId = ethers.randomBytes(32);
      const outcomeSlotCount = 0;

      await expect(conditionalTokens.prepareCondition(oracle, questionId, outcomeSlotCount)).to.be.revertedWith(
        "there should be more than one outcome slot",
      );
    });

    it("is not able to prepare a condition with just one outcome slots", async function () {
      const questionId = ethers.randomBytes(32);
      const outcomeSlotCount = 1;

      await expect(conditionalTokens.prepareCondition(oracle, questionId, outcomeSlotCount)).to.be.revertedWith(
        "there should be more than one outcome slot",
      );
    });

    it("is not able to prepare a condition with more than 256 outcome slots", async function () {
      const questionId = ethers.randomBytes(32);
      const outcomeSlotCount = 257;

      await expect(conditionalTokens.prepareCondition(oracle, questionId, outcomeSlotCount)).to.be.revertedWith(
        "too many outcome slots",
      );
    });

    context("with valid parameters", function () {
      const questionId = ethers.randomBytes(32);
      const outcomeSlotCount = 256;
      let trx: ContractTransactionResponse;
      let conditionId: string;
      beforeEach(async function () {
        conditionId = getConditionId(oracle.address, questionId, outcomeSlotCount);
        trx = await conditionalTokens.prepareCondition(oracle, questionId, outcomeSlotCount);
      });

      it("emits a ConditionPreparation event", async function () {
        expect(trx).to.emit(conditionalTokens, "ConditionPreparation");
      });

      it("makes outcome slot count available via getOutcomeSlotCount", async function () {
        expect(await conditionalTokens.getOutcomeSlotCount(conditionId)).to.equal(outcomeSlotCount);
      });

      it("is not able to prepare the same condition more than once", async function () {
        await expect(conditionalTokens.prepareCondition(oracle, questionId, outcomeSlotCount)).to.be.revertedWith(
          "condition already prepared",
        );
      });
    });
  });

  describe("reportPayouts", function () {
    const questionId = ethers.randomBytes(32);
    const outcomeSlotCount = 2;
    beforeEach(async function () {
      await conditionalTokens.prepareCondition(oracle, questionId, outcomeSlotCount);
    });

    it("reverts if payouts length is 0", async function () {
      await expect(conditionalTokens.reportPayouts(questionId, [])).to.be.revertedWith(
        "there should be more than one outcome slot",
      );
    });
    it("reverts if call multiple times with the same question", async function () {
      const oracleSigner = await ethers.getSigner(oracle.address);
      const payouts = [1, 0];
      await conditionalTokens.connect(oracleSigner).reportPayouts(questionId, payouts);
      await expect(conditionalTokens.connect(oracleSigner).reportPayouts(questionId, payouts)).to.be.revertedWith(
        "payout denominator already set",
      );
    });
    it("reverts if all payouts are 0", async function () {
      const oracleSigner = await ethers.getSigner(oracle.address);
      const payouts = [0, 0];
      await expect(conditionalTokens.connect(oracleSigner).reportPayouts(questionId, payouts)).to.be.revertedWith(
        "payout is all zeroes",
      );
    });
  });

  describe("splitting and merging", function () {
    const questionId = ethers.randomBytes(32);
    const outcomeSlotCount = 3;
    let conditionId: string;
    const splitAmount = 1000;
    const mergeAmount = 500;
    // [A|B, C]
    const validPartition = [getBitMaskDecimal([0, 1], outcomeSlotCount), getBitMaskDecimal([2], outcomeSlotCount)];
    beforeEach(async function () {
      conditionId = getConditionId(oracle.address, questionId, outcomeSlotCount);
    });
    context("splitting", function () {
      it("reverts if partition is empty", async function () {
        await expect(
          conditionalTokens.splitPosition(collateralToken, EMPTY_PARENT_COLLECTION_ID, conditionId, [], splitAmount),
        ).to.be.revertedWith("got empty or singleton partition");
      });
      it("reverts if condition is not prepared", async function () {
        await expect(
          conditionalTokens.splitPosition(
            collateralToken,
            EMPTY_PARENT_COLLECTION_ID,
            conditionId,
            validPartition,
            splitAmount,
          ),
        ).to.be.revertedWith("condition not prepared yet");
      });
      it("reverts if indexSet is invalid", async function () {
        await conditionalTokens.prepareCondition(oracle, questionId, outcomeSlotCount);
        await expect(
          conditionalTokens.splitPosition(
            collateralToken,
            EMPTY_PARENT_COLLECTION_ID,
            conditionId,
            [8, 1], //outcomeSlotCount is 3 so fullIndexSet is 111 -> 7
            splitAmount,
          ),
        ).to.be.revertedWith("got invalid index set");
      });

      it("reverts if partition not disjoint", async function () {
        await conditionalTokens.prepareCondition(oracle, questionId, outcomeSlotCount);
        await expect(
          conditionalTokens.splitPosition(
            collateralToken,
            EMPTY_PARENT_COLLECTION_ID,
            conditionId,
            [getBitMaskDecimal([0, 1], outcomeSlotCount), getBitMaskDecimal([1, 2], outcomeSlotCount)],
            splitAmount,
          ),
        ).to.be.revertedWith("partition not disjoint");
      });

      it("reverts if user not approve token transfer", async function () {
        await conditionalTokens.prepareCondition(oracle, questionId, outcomeSlotCount);
        await expect(
          conditionalTokens.splitPosition(
            collateralToken,
            EMPTY_PARENT_COLLECTION_ID,
            conditionId,
            validPartition,
            splitAmount,
          ),
        ).to.be.reverted;
      });
    });
    context("merging", function () {
      it("reverts if partition is empty", async function () {
        await expect(
          conditionalTokens.mergePositions(collateralToken, EMPTY_PARENT_COLLECTION_ID, conditionId, [], mergeAmount),
        ).to.be.revertedWith("got empty or singleton partition");
      });
      it("reverts if condition is not prepared", async function () {
        await expect(
          conditionalTokens.mergePositions(
            collateralToken,
            EMPTY_PARENT_COLLECTION_ID,
            conditionId,
            validPartition,
            mergeAmount,
          ),
        ).to.be.revertedWith("condition not prepared yet");
      });
      it("reverts if indexSet is invalid", async function () {
        await conditionalTokens.prepareCondition(oracle, questionId, outcomeSlotCount);
        await expect(
          conditionalTokens.mergePositions(
            collateralToken,
            EMPTY_PARENT_COLLECTION_ID,
            conditionId,
            [8, 1], //outcomeSlotCount is 3 so fullIndexSet is 111 -> 7
            mergeAmount,
          ),
        ).to.be.revertedWith("got invalid index set");
      });

      it("reverts if partition not disjoint", async function () {
        await conditionalTokens.prepareCondition(oracle, questionId, outcomeSlotCount);
        await expect(
          conditionalTokens.mergePositions(
            collateralToken,
            EMPTY_PARENT_COLLECTION_ID,
            conditionId,
            [getBitMaskDecimal([0, 1], outcomeSlotCount), getBitMaskDecimal([1, 2], outcomeSlotCount)],
            mergeAmount,
          ),
        ).to.be.revertedWith("partition not disjoint");
      });
    });

    context("redeeming", function () {
      it("reverts if no result", async function () {
        await expect(
          conditionalTokens.redeemPositions(collateralToken, EMPTY_PARENT_COLLECTION_ID, conditionId, validPartition),
        ).to.be.revertedWith("result for condition not received yet");
      });

      it("reverts if indexSet is invalid", async function () {
        await conditionalTokens.prepareCondition(oracle, questionId, outcomeSlotCount);
        await collateralToken.approve(conditionalTokens, splitAmount);
        await conditionalTokens.splitPosition(
          collateralToken,
          EMPTY_PARENT_COLLECTION_ID,
          conditionId,
          validPartition,
          splitAmount,
        );
        const payouts = [1, 0, 0];
        const oracleSigner = await ethers.getSigner(oracle.address);
        await conditionalTokens.connect(oracleSigner).reportPayouts(questionId, payouts);
        await expect(
          conditionalTokens.redeemPositions(
            collateralToken,
            EMPTY_PARENT_COLLECTION_ID,
            conditionId,
            [8, 1], //outcomeSlotCount is 3 so fullIndexSet is 111 -> 7
          ),
        ).to.be.revertedWith("got invalid index set");
      });
    });

    context("with valid split", function () {
      let splitTrx: Promise<ContractTransactionResponse>;
      beforeEach(async function () {
        await conditionalTokens.prepareCondition(oracle, questionId, outcomeSlotCount);

        // approve token transfer
        await collateralToken.approve(conditionalTokens, splitAmount);
        splitTrx = conditionalTokens.splitPosition(
          collateralToken,
          EMPTY_PARENT_COLLECTION_ID,
          conditionId,
          validPartition,
          splitAmount,
        );
      });

      it("emits a PositionSplit event", async function () {
        await expect(splitTrx).to.emit(conditionalTokens, "PositionSplit");
      });
      it("transfer collateral from user to the contract", async function () {
        await expect(splitTrx).to.changeTokenBalances(
          collateralToken,
          [conditionalTokens, owner],
          [splitAmount, -splitAmount],
        );
      });
      it("mints position tokens", async function () {
        for (const indexSet of validPartition) {
          const positionId = await conditionalTokens.getPositionId(
            collateralToken,
            await conditionalTokens.getCollectionId(EMPTY_PARENT_COLLECTION_ID, conditionId, indexSet),
          );
          expect(await conditionalTokens.balanceOf(owner, positionId)).to.equal(splitAmount);
        }
      });

      context("calling splitPosition again", function () {
        context("splits position A|B to A and B", function () {
          beforeEach(async function () {
            await conditionalTokens.splitPosition(
              collateralToken,
              EMPTY_PARENT_COLLECTION_ID,
              conditionId,
              [getBitMaskDecimal([0], outcomeSlotCount), getBitMaskDecimal([1], outcomeSlotCount)],
              splitAmount,
            );
          });
          it("burns A|B token and mins A and B tokens", async function () {
            const prevPositionId = await conditionalTokens.getPositionId(
              collateralToken,
              await conditionalTokens.getCollectionId(
                EMPTY_PARENT_COLLECTION_ID,
                conditionId,
                getBitMaskDecimal([0, 1], outcomeSlotCount),
              ),
            );
            const positionAId = await conditionalTokens.getPositionId(
              collateralToken,
              await conditionalTokens.getCollectionId(
                EMPTY_PARENT_COLLECTION_ID,
                conditionId,
                getBitMaskDecimal([0], outcomeSlotCount),
              ),
            );
            expect(await conditionalTokens.balanceOf(owner, prevPositionId)).to.equal(0);
            expect(await conditionalTokens.balanceOf(owner, positionAId)).to.equal(splitAmount);
          });
          context("merges A and B to A|B token", async function () {
            beforeEach(async function () {
              await conditionalTokens.mergePositions(
                collateralToken,
                EMPTY_PARENT_COLLECTION_ID,
                conditionId,
                [getBitMaskDecimal([0], outcomeSlotCount), getBitMaskDecimal([1], outcomeSlotCount)],
                mergeAmount,
              );
            });
            it("burns A and B tokens and mint A|B token", async function () {
              const positionAId = await conditionalTokens.getPositionId(
                collateralToken,
                await conditionalTokens.getCollectionId(
                  EMPTY_PARENT_COLLECTION_ID,
                  conditionId,
                  getBitMaskDecimal([0], outcomeSlotCount),
                ),
              );
              const positionABId = await conditionalTokens.getPositionId(
                collateralToken,
                await conditionalTokens.getCollectionId(
                  EMPTY_PARENT_COLLECTION_ID,
                  conditionId,
                  getBitMaskDecimal([0, 1], outcomeSlotCount),
                ),
              );
              expect(await conditionalTokens.balanceOf(owner, positionABId)).to.equal(mergeAmount);
              expect(await conditionalTokens.balanceOf(owner, positionAId)).to.equal(splitAmount - mergeAmount);
            });
          });
        });
        context("splits position A|B to deeper positions", function () {
          let parentCollectionId: string;
          let secondQuestionCondition: string;
          const secondQuestionId = ethers.randomBytes(32);
          const secondQuestionOutcomeSlotCount = 2;
          beforeEach(async function () {
            // splits A|B to A|B and X + A|B and Y
            parentCollectionId = await conditionalTokens.getCollectionId(
              EMPTY_PARENT_COLLECTION_ID,
              conditionId,
              getBitMaskDecimal([0, 1], outcomeSlotCount),
            );
            secondQuestionCondition = await conditionalTokens.getConditionId(
              oracle.address,
              secondQuestionId,
              secondQuestionOutcomeSlotCount,
            );
            await conditionalTokens.prepareCondition(oracle.address, secondQuestionId, secondQuestionOutcomeSlotCount);
            await conditionalTokens.splitPosition(
              collateralToken,
              parentCollectionId,
              secondQuestionCondition,
              [
                getBitMaskDecimal([0], secondQuestionOutcomeSlotCount),
                getBitMaskDecimal([1], secondQuestionOutcomeSlotCount),
              ],
              splitAmount,
            );
          });
          it("burns A|B token and mint A|B-X and A|B-Y token", async function () {
            const prevPositionId = await conditionalTokens.getPositionId(
              collateralToken,
              await conditionalTokens.getCollectionId(
                EMPTY_PARENT_COLLECTION_ID,
                conditionId,
                getBitMaskDecimal([0, 1], outcomeSlotCount),
              ),
            );
            const newPositionId = await conditionalTokens.getPositionId(
              collateralToken,
              await conditionalTokens.getCollectionId(
                parentCollectionId,
                secondQuestionCondition,
                getBitMaskDecimal([0], outcomeSlotCount),
              ),
            );
            expect(await conditionalTokens.balanceOf(owner, prevPositionId)).to.equal(0);
            expect(await conditionalTokens.balanceOf(owner, newPositionId)).to.equal(splitAmount);
          });
          context("merges A|B-X and A|B-Y to A|B token", async function () {
            beforeEach(async function () {
              await conditionalTokens.mergePositions(
                collateralToken,
                parentCollectionId,
                secondQuestionCondition,
                [
                  getBitMaskDecimal([0], secondQuestionOutcomeSlotCount),
                  getBitMaskDecimal([1], secondQuestionOutcomeSlotCount),
                ],
                mergeAmount,
              );
            });
            it("burns A|B-X and A|B-Y tokens and mint A|B token", async function () {
              const positionABXId = await conditionalTokens.getPositionId(
                collateralToken,
                await conditionalTokens.getCollectionId(
                  parentCollectionId,
                  secondQuestionCondition,
                  getBitMaskDecimal([0], outcomeSlotCount),
                ),
              );
              const positionABId = await conditionalTokens.getPositionId(
                collateralToken,
                await conditionalTokens.getCollectionId(
                  EMPTY_PARENT_COLLECTION_ID,
                  conditionId,
                  getBitMaskDecimal([0, 1], outcomeSlotCount),
                ),
              );
              expect(await conditionalTokens.balanceOf(owner, positionABId)).to.equal(mergeAmount);
              expect(await conditionalTokens.balanceOf(owner, positionABXId)).to.equal(splitAmount - mergeAmount);
            });
          });
          context("X is the winning position", function () {
            beforeEach(async function () {
              const payouts = [1, 0];
              const oracleSigner = await ethers.getSigner(oracle.address);
              await conditionalTokens.connect(oracleSigner).reportPayouts(secondQuestionId, payouts);
            });
            it("mints A|B token when redeems A|B-X", async function () {
              await conditionalTokens.redeemPositions(collateralToken, parentCollectionId, secondQuestionCondition, [
                getBitMaskDecimal([0], secondQuestionOutcomeSlotCount),
              ]);
              const positionABXId = await conditionalTokens.getPositionId(
                collateralToken,
                await conditionalTokens.getCollectionId(
                  parentCollectionId,
                  secondQuestionCondition,
                  getBitMaskDecimal([0], outcomeSlotCount),
                ),
              );
              const positionABId = await conditionalTokens.getPositionId(
                collateralToken,
                await conditionalTokens.getCollectionId(
                  EMPTY_PARENT_COLLECTION_ID,
                  conditionId,
                  getBitMaskDecimal([0, 1], outcomeSlotCount),
                ),
              );
              expect(await conditionalTokens.balanceOf(owner, positionABId)).to.equal(splitAmount);
              expect(await conditionalTokens.balanceOf(owner, positionABXId)).to.equal(0);
            });
          });
        });
      });

      context("with valid merge", function () {
        let mergeTrx: Promise<ContractTransactionResponse>;
        beforeEach(async function () {
          mergeTrx = conditionalTokens.mergePositions(
            collateralToken,
            EMPTY_PARENT_COLLECTION_ID,
            conditionId,
            validPartition,
            mergeAmount,
          );
        });

        it("emits a PositionsMerge event", async function () {
          await expect(mergeTrx).to.emit(conditionalTokens, "PositionsMerge");
        });
        it("transfer collateral from the contract to the user", async function () {
          await expect(mergeTrx).to.changeTokenBalances(
            collateralToken,
            [conditionalTokens, owner],
            [-mergeAmount, mergeAmount],
          );
        });
        it("burns position tokens", async function () {
          for (const indexSet of validPartition) {
            const positionId = await conditionalTokens.getPositionId(
              collateralToken,
              await conditionalTokens.getCollectionId(EMPTY_PARENT_COLLECTION_ID, conditionId, indexSet),
            );
            expect(await conditionalTokens.balanceOf(owner, positionId)).to.equal(splitAmount - mergeAmount);
          }
        });
      });
    });
  });

  describe("reporting and redeeming", function () {
    const questionId = ethers.randomBytes(32);
    const outcomeSlotCount = 3;
    let conditionId: string;

    const splitAmount = 1000;
    const validPartition = Array(outcomeSlotCount)
      .fill(0)
      .map((_, index) => getBitMaskDecimal([index], outcomeSlotCount));
    const payouts = [1, 0, 0]; //winning position 0
    beforeEach(async function () {
      conditionId = getConditionId(oracle.address, questionId, outcomeSlotCount);
      await conditionalTokens.prepareCondition(oracle, questionId, outcomeSlotCount);

      // approve token transfer
      await collateralToken.approve(conditionalTokens, splitAmount);

      // split position
      await conditionalTokens.splitPosition(
        collateralToken,
        EMPTY_PARENT_COLLECTION_ID,
        conditionId,
        validPartition,
        splitAmount,
      );
    });
    it("reverts if not oracle calls reportPayouts", async function () {
      await expect(conditionalTokens.reportPayouts(questionId, payouts)).to.reverted;
    });
    context("with valid report", function () {
      let reportTrx: Promise<ContractTransactionResponse>;
      beforeEach(async function () {
        const oracleSigner = await ethers.getSigner(oracle.address);
        reportTrx = conditionalTokens.connect(oracleSigner).reportPayouts(questionId, payouts);
      });
      it("emits a ConditionResolution event", async function () {
        await expect(reportTrx).to.emit(conditionalTokens, "ConditionResolution");
      });
      describe("redeeming", function () {
        let redeemTrx: Promise<ContractTransactionResponse>;
        context("with winning position", function () {
          beforeEach(async function () {
            await reportTrx;
            redeemTrx = conditionalTokens.redeemPositions(
              collateralToken,
              EMPTY_PARENT_COLLECTION_ID,
              conditionId,
              validPartition.slice(0, 1),
            );
          });
          it("emits a PayoutRedemption event", async function () {
            await expect(redeemTrx).to.emit(conditionalTokens, "PayoutRedemption");
          });
          it("sends collateral to user and clear redeemed position", async function () {
            await expect(redeemTrx).to.changeTokenBalances(
              collateralToken,
              [conditionalTokens, owner],
              [-splitAmount, splitAmount],
            );
            for (const indexSet of validPartition) {
              const positionId = await conditionalTokens.getPositionId(
                collateralToken,
                await conditionalTokens.getCollectionId(EMPTY_PARENT_COLLECTION_ID, conditionId, indexSet),
              );
              if (indexSet === validPartition[0]) {
                expect(await conditionalTokens.balanceOf(owner, positionId)).to.equal(0);
              } else {
                expect(await conditionalTokens.balanceOf(owner, positionId)).to.equal(splitAmount);
              }
            }
          });
        });
      });
    });
  });
});

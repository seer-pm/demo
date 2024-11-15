import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
} from "matchstick-as/assembly/index";
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  MarketDataQuestion,
  processMarket,
} from "../src/market-factory";
import { createNewMarketEvent, createNewReopenQuestionEvent } from "./tests-utils";
import { Market } from "../generated/schema";
import { handleReopenQuestion } from "../src/reality";

let marketId = "0x43d881F5920ed29FC5CD4917D6817496ABbbA6d9";
let marketName = "Who will win the 2024 U.S. Presidential Election?";
let parentMarket = Address.zero();
let conditionId = Bytes.fromHexString(
  "0x0d330598c79f3a248b45c4032a4f75e745c6bf27cd23a676e5c9560e121487d9"
);
let questionId = Bytes.fromHexString(
  "0x668608b9ad15b69926a2ce851744a1d79a08aa687b6f411499aed410f6061df0"
);
let newQuestionId = Bytes.fromHexString(
  "0x565cd71012a4374e20120c0d08505fdc8efd24be1cefbb9796dc2221b573bc10"
);
let questionsIds = [
  Bytes.fromHexString(
    "0x9e3756aaa0306e93f5096420e77f7f0c13c29f11b5882f820e152c86259aae70"
  ),
];

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let newNewMarketEvent = createNewMarketEvent(
      Address.fromString(marketId),
      marketName,
      parentMarket,
      conditionId,
      questionId,
      questionsIds
    );

    const questions: MarketDataQuestion[] = [
      {
        arbitrator: Address.fromBytes(
          Bytes.fromHexString("0x68154EA682f95BF582b80Dd6453FA401737491Dc")
        ),
        opening_ts: BigInt.fromI32(1730836800),
        timeout: BigInt.fromI32(302400),
        finalize_ts: BigInt.fromI32(1731194915),
        is_pending_arbitration: false,
        best_answer: Bytes.fromHexString(
          "0x0000000000000000000000000000000000000000000000000000000000000001"
        ),
        bond: BigInt.fromString("10000000000000000000"),
        min_bond: BigInt.fromString("10000000000000000000"),
      },
    ];

    processMarket(newNewMarketEvent, {
      id: marketId,
      marketName,
      outcomes: ["Donald Trump", "Kamala Harris"],
      lowerBound: BigInt.zero(),
      upperBound: BigInt.zero(),
      parentCollectionId: Bytes.fromHexString(
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      ),
      parentOutcome: BigInt.zero(),
      parentMarket,
      wrappedTokens: [
        Address.fromBytes(
          Bytes.fromHexString("0x68984a7D283fF918e530368E6AAaD1fC2af88692")
        ),
        Address.fromBytes(
          Bytes.fromHexString("0x6b8c2ae8DBa895620475259e95377FDe08FBF02a")
        ),
        Address.fromBytes(
          Bytes.fromHexString("0x7eec58191E30f2550e2BE43664D6F8017A359dc5")
        ),
      ],
      conditionId,
      questionId,
      questionsIds,
      templateId: BigInt.fromI32(2),
      encodedQuestions: [
        `Who will win the 2024 U.S. Presidential Election?␟"Kamala Harris","Donald Trump"␟misc␟en_US`,
      ],
      questions: questions,
    });
  });

  afterAll(() => {
    clearStore();
  });

  test("Questions reopened", () => {
    assert.entityCount("Market", 1);

    // assert market
    let market1 = Market.load(marketId)!

    const oldQuestion0 = Bytes.fromHexString(market1.questions.load()[0].question);

    assert.bytesEquals(
      oldQuestion0,
      questionsIds[0]
    );

    // reopen question
    handleReopenQuestion(
      createNewReopenQuestionEvent(
        newQuestionId,
        oldQuestion0
      )
    )

    // assert new question
    const newQuestion0 = Bytes.fromHexString(market1.questions.load()[0].question);

    assert.bytesEquals(
      newQuestion0,
      newQuestionId
    );
  });
});

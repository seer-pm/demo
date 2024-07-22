import ArbitrationFlow from "./ArbitrationFlow";

async function main() {
  const arbitrationFlow = new ArbitrationFlow();
  await arbitrationFlow.init();

  // fourth step after rule
  const questionId = "0x0d1f11db2736ca9399c9d74d0f139705cd088b889168547281ef791f8419adf6";
  //not current history hash, if only 1 answer, prev history hash is bytes(0)
  const prevHistoryHash = '0x0000000000000000000000000000000000000000000000000000000000000000'
  const lastAnswerer = '0xEFb8e220F012241A00F5DAE4A5B2c473a742a63a'

  await arbitrationFlow.reportArbitrationAnswer(questionId, prevHistoryHash, lastAnswerer);

  console.log("Finished");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

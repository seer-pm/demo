import ArbitrationFlow from "./ArbitrationFlow";

async function main() {
  const arbitrationFlow = new ArbitrationFlow();
  await arbitrationFlow.init();

  // second step after receive arbitration request
  const requester = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";
  const questionId = "0x0d1f11db2736ca9399c9d74d0f139705cd088b889168547281ef791f8419adf6";

  const disputeId = await arbitrationFlow.receiveArbitrationAcknowledgement(questionId, requester);
  console.log("Finished", disputeId);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

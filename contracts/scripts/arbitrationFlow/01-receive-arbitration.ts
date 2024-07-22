import ArbitrationFlow from "./ArbitrationFlow";

async function main() {
  const arbitrationFlow = new ArbitrationFlow();
  await arbitrationFlow.init();
  // after raise a dispute from fe, you should have a transaction id and a requester
  const transactionId = "0x4693bbdd08dd9c38315760eb17579b60f561cae2818108fcaf98938435330cd0";

  await arbitrationFlow.receiveArbitrationRequest(transactionId);
  console.log('Finished')
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

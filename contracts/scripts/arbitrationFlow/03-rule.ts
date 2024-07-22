import ArbitrationFlow from "./ArbitrationFlow";

async function main() {
  const arbitrationFlow = new ArbitrationFlow();
  await arbitrationFlow.init();

  // third step after receive arbitration acknowledgement
  const disputeId = 1645n;
  // arbitrator choose first answer (0 is invalid)
  const ruling = 1;

  await arbitrationFlow.rule(disputeId, ruling);

  console.log("Finished");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

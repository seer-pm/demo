import ArbitrationFlow from "./ArbitrationFlow";

async function main() {
  const arbitrationFlow = new ArbitrationFlow();
  await arbitrationFlow.resetNetworks();

  console.log("Finished");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

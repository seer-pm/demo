import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface VerifyOptions {
  /** Only verify the deployment with this name. */
  contract?: string;
  /** Milliseconds to wait between contracts (Etherscan rate limit). */
  sleepBetween?: number;
}

/**
 * Networks with `verify.etherscan.apiUrl` set use an Etherscan v1-compatible explorer (Blockscout on Gnosis),
 * handled by hardhat-deploy's `etherscan-verify` task. Every other network goes through
 * @nomicfoundation/hardhat-verify, which uses the Etherscan API v2 with a single `ETHERSCAN_API_KEY`.
 */
function usesBlockscout(hre: HardhatRuntimeEnvironment): boolean {
  return !!hre.network.verify?.etherscan?.apiUrl;
}

async function verifyWithHardhatVerify(hre: HardhatRuntimeEnvironment, options: VerifyOptions) {
  const deployments = await hre.deployments.all();
  const names = Object.keys(deployments).filter((name) => !options.contract || name === options.contract);

  if (names.length === 0) {
    throw new Error(`No deployments found for network ${hre.network.name}`);
  }

  const failed: string[] = [];

  for (const [index, name] of names.entries()) {
    const deployment = deployments[name];

    if (!deployment.metadata) {
      // external contract saved into deployments/ by hand (no compiler metadata): not ours to verify
      console.log(`Skipping ${name} at ${deployment.address}: external deployment`);
      continue;
    }

    console.log(`Verifying ${name} at ${deployment.address}...`);

    try {
      await hre.run("verify:verify", {
        address: deployment.address,
        constructorArguments: deployment.args ?? [],
        libraries: deployment.libraries ?? {},
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes("already verified")) {
        console.log(`${name} is already verified`);
      } else {
        console.error(`Failed to verify ${name}: ${message}`);
        failed.push(name);
      }
    }

    if (index < names.length - 1) {
      await sleep(options.sleepBetween ?? 2000);
    }
  }

  if (failed.length > 0) {
    throw new Error(`Verification failed for: ${failed.join(", ")}`);
  }
}

/** Verifies the hardhat-deploy deployments of the current network. Throws if any verification fails. */
async function verifyDeployments(hre: HardhatRuntimeEnvironment, options: VerifyOptions = {}) {
  if (usesBlockscout(hre)) {
    await hre.run("etherscan-verify", { contractName: options.contract });
    return;
  }

  await verifyWithHardhatVerify(hre, options);
}

task("verify-deployments", "Verify hardhat-deploy deployments (Blockscout or Etherscan API v2 depending on the network)")
  .addOptionalParam("contract", "Only verify the deployment with this name", undefined, types.string)
  .addOptionalParam("sleepBetween", "Milliseconds to wait between contracts", 2000, types.int)
  .setAction(async (args: { contract?: string; sleepBetween: number }, hre) => {
    await verifyDeployments(hre, args);
  });

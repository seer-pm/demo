/**
 * CreditsManager Management Script
 *
 * This script allows you to interact with Seer or Opportunity credits contracts to:
 * - Set credits balance for multiple addresses
 * - Add/remove contracts from the whitelist
 * - Add/remove output tokens from the whitelist
 *
 * Usage:
 * 1. Modify the configuration object below with your desired addresses and amounts
 * 2. Set creditsType to "seer" or "opportunity"
 * 3. Leave objects empty or strings empty to skip those actions
 * 4. Run: npx hardhat run scripts/trading-credits.js --network <network>
 *
 * Example networks: localhost, hardhat, gnosis, ethereum, etc.
 *
 * To skip an action:
 * - Leave credits object empty to skip setCreditsBalance
 * - Leave contractToWhitelist empty to skip setWhitelistedContract
 */

const { ethers } = require("hardhat");

const CREDITS = {
  seer: { token: "SeerCredits", manager: "CreditsManager", tokenArtifact: "SeerCredits" },
  opportunity: { token: "OpportunityCredits", manager: "OpportunityCreditsManager", tokenArtifact: "OpportunityCredits" },
};

async function main() {
  // Configuration - modify these values as needed
  const config = {
    // "seer" | "opportunity"
    creditsType: "opportunity",

    // Set credits for addresses (leave empty object to skip this action)
    // amounts are in decimal units (e.g., "1" = 1 token, "0.5" = 0.5 tokens)
    credits: {
      "0xd6a2a456B48836f38ACE550C59c421CA24f1681A": "0.3",
    },

    // Contract to add to whitelist (leave empty string to skip this action)
    contractToWhitelist: "0xfFB643E73f280B97809A8b41f7232AB401a04ee1",
  };

  const selected = CREDITS[config.creditsType];
  if (!selected) {
    throw new Error(`Unknown creditsType: ${config.creditsType}`);
  }

  // Get the credits + manager contracts for the selected type
  const { deployments } = require("hardhat");
  const CreditsDeployment = await deployments.get(selected.token);
  const Credits = await ethers.getContractAt(selected.tokenArtifact, CreditsDeployment.address);
  const CreditsManagerDeployment = await deployments.get(selected.manager);
  const CreditsManager = await ethers.getContractAt("CreditsManager", CreditsManagerDeployment.address);
  const [deployer] = await ethers.getSigners();

  console.log("Using account:", deployer.address);
  console.log("creditsType:", config.creditsType);
  console.log(`${selected.token} contract:`, CreditsDeployment.address);
  console.log(`${selected.manager} contract:`, CreditsManagerDeployment.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Set credits balance (only if credits object has entries)
  if (Object.keys(config.credits).length > 0) {
    console.log("\n=== Setting Credits Balance ===");

    // Convert credits object to arrays for the contract call
    const addresses = Object.keys(config.credits);
    const amounts = Object.values(config.credits);

    console.log("Credits to set:");
    addresses.forEach((address, index) => {
      console.log(`  ${address}: ${amounts[index]} tokens`);
    });

    try {
      // Convert amounts from decimal to wei
      const amountsInWei = amounts.map(amount => ethers.parseEther(amount));

      const tx = await Credits.setCreditsBalance(addresses, amountsInWei);
      console.log("Transaction hash:", tx.hash);
      await tx.wait();
      console.log("✅ Credits balance set successfully!");
    } catch (error) {
      console.error("❌ Error setting credits balance:", error.message);
    }
  } else {
    console.log("⏭️  Skipping setCreditsBalance - no credits provided");
  }

  // Add contract to whitelist (only if contractToWhitelist is provided)
  if (config.contractToWhitelist && config.contractToWhitelist.trim() !== "") {
    console.log("\n=== Adding Contract to Whitelist ===");
    console.log("Contract address:", config.contractToWhitelist);

    try {
      const tx = await CreditsManager.setWhitelistedContract(config.contractToWhitelist, true);
      console.log("Transaction hash:", tx.hash);
      await tx.wait();
      console.log("✅ Contract added to whitelist successfully!");
    } catch (error) {
      console.error("❌ Error adding contract to whitelist:", error.message);
    }
  } else {
    console.log("⏭️  Skipping setWhitelistedContract - no contract address provided");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

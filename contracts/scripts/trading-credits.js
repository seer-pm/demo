/**
 * CreditsManager Management Script
 * 
 * This script allows you to interact with the CreditsManager contract to:
 * - Set credits balance for multiple addresses
 * - Add/remove contracts from the whitelist
 * - Add/remove output tokens from the whitelist
 * 
 * Usage:
 * 1. Modify the configuration object below with your desired addresses and amounts
 * 2. Leave objects empty or strings empty to skip those actions
 * 3. Run: npx hardhat run scripts/credits-manager.js --network <network>
 * 
 * Example networks: localhost, hardhat, gnosis, ethereum, etc.
 * 
 * To skip an action:
 * - Leave credits object empty to skip setCreditsBalance
 * - Leave contractToWhitelist empty to skip setWhitelistedContract
 */

const { ethers } = require("hardhat");

async function main() {
  // Configuration - modify these values as needed
  const config = {
    // Set credits for addresses (leave empty object to skip this action)
    // amounts are in decimal units (e.g., "1" = 1 token, "0.5" = 0.5 tokens)
    credits: {
      "0x0000000000000000000000000000000000000000": "1",
    },
    
    // Contract to add to whitelist (leave empty string to skip this action)
    contractToWhitelist: "0xfFB643E73f280B97809A8b41f7232AB401a04ee1",
  };

  // Get the CreditsManager contract
  const { deployments } = require("hardhat");
  const SeerCreditsDeployment = await deployments.get("SeerCredits");
  const SeerCredits = await ethers.getContractAt("SeerCredits", SeerCreditsDeployment.address);
  const CreditsManagerDeployment = await deployments.get("CreditsManager");
  const CreditsManager = await ethers.getContractAt("CreditsManager", CreditsManagerDeployment.address);
  const [deployer] = await ethers.getSigners();
  
  console.log("Using account:", deployer.address);
  console.log("SeerCredits contract:", SeerCredits.address);
  console.log("CreditsManager contract:", CreditsManager.address);
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
      
      const tx = await SeerCredits.setCreditsBalance(addresses, amountsInWei);
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

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploying WL Marketplace...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying from:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH\n");

  if (balance === 0n) {
    console.error("❌ No ETH! Get Sepolia ETH from:");
    console.log("   https://www.alchemy.com/faucets/ethereum-sepolia\n");
    process.exit(1);
  }

  // Deploy WL Marketplace
  console.log("📦 Deploying EncryptedWLMarketplace contract...");
  const Marketplace = await ethers.getContractFactory("EncryptedWLMarketplace");
  const marketplace = await Marketplace.deploy();
  await marketplace.waitForDeployment();
  
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ Marketplace deployed to:", marketplaceAddress);
  console.log();

  // Wait for confirmations
  console.log("⏳ Waiting for 3 confirmations...");
  await marketplace.deploymentTransaction()?.wait(3);
  console.log("✅ Confirmed!\n");

  // Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    chainId: "11155111",
    contractAddress: marketplaceAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    transactionHash: marketplace.deploymentTransaction()?.hash,
    fhevmEnabled: true,
    fhevmVersion: "0.9.1",
    platformFee: "2.5%",
    confirmationWindow: "12 hours",
    maxMintDelay: "1 year"
  };

  // Create deployments directory
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment file
  const deploymentFile = path.join(deploymentsDir, "sepolia-marketplace.json");
  fs.writeFileSync(
    deploymentFile,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("💾 Deployment info saved to:", deploymentFile, "\n");

  // Display summary
  console.log("═══════════════════════════════════════════════════");
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("═══════════════════════════════════════════════════");
  console.log();
  console.log("📍 Contract Address:", marketplaceAddress);
  console.log("🌐 Network: Sepolia (FHEVM Enabled)");
  console.log("🔗 Explorer:", `https://sepolia.etherscan.io/address/${marketplaceAddress}`);
  console.log();
  console.log("💰 Platform Settings:");
  console.log("   Fee: 2.5%");
  console.log("   Confirmation Window: 12 hours");
  console.log("   Max Mint Delay: 1 year");
  console.log();
  console.log("═══════════════════════════════════════════════════");
  console.log();

  console.log("📝 NEXT STEPS:\n");
  console.log("1. Save this contract address:");
  console.log(`   ${marketplaceAddress}\n`);
  
  console.log("2. Verify contract:");
  console.log(`   npx hardhat verify --network sepolia ${marketplaceAddress}\n`);
  
  console.log("3. Update frontend .env.local:");
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${marketplaceAddress}\n`);

  console.log("4. Deploy frontend:");
  console.log("   cd ../wl-marketplace-frontend");
  console.log("   npm install");
  console.log("   npm run dev\n");

  console.log("🔗 IMPORTANT LINKS:");
  console.log(`   Contract: https://sepolia.etherscan.io/address/${marketplaceAddress}`);
  console.log("   Zama Docs: https://docs.zama.ai");
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED!\n");
    console.error(error);
    process.exit(1);
  });

import { ethers } from "ethers";
import { readFileSync } from "fs";
import { config as dotenvConfig } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenvConfig({ path: resolve(__dirname, '../../paymentSystem/.env.local') });

async function main() {
  const merchantWallet = process.env.MERCHANT_WALLET_ADDRESS;
  const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
  const rpcUrl = process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
  
  if (!merchantWallet) {
    throw new Error("MERCHANT_WALLET_ADDRESS not set in .env.local");
  }
  
  if (!deployerKey) {
    throw new Error("DEPLOYER_PRIVATE_KEY not set in .env.local");
  }
  
  console.log("🚀 Deploying X402Escrow...");
  console.log("   Merchant Wallet:", merchantWallet);
  console.log("   Network: Base Sepolia");
  console.log("   RPC:", rpcUrl);
  
  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(deployerKey, provider);
  
  console.log("   Deployer:", wallet.address);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log("   Balance:", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    throw new Error("Deployer wallet has no ETH. Get testnet ETH from https://www.alchemy.com/faucets/base-sepolia");
  }
  
  // Read compiled contract
  const artifactPath = resolve(__dirname, '../artifacts/X402Escrow.sol/X402Escrow.json');
  const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));
  
  // Create contract factory
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  // Deploy
  console.log("\n📤 Sending deployment transaction...");
  const contract = await factory.deploy(merchantWallet);
  
  console.log("   Transaction hash:", contract.deploymentTransaction().hash);
  console.log("   Waiting for confirmation...");
  
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  
  console.log("\n✅ X402Escrow deployed to:", address);
  console.log("\n📝 Add to .env.local:");
  console.log(`ESCROW_CONTRACT_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=${address}`);
  
  const timeout = await contract.TIMEOUT();
  console.log("\n⏱️  Payment timeout:", timeout.toString(), "seconds (15 minutes)");
  
  console.log("\n🔍 Verify on BaseScan:");
  console.log(`https://sepolia.basescan.org/address/${address}`);
  
  console.log("\n🎯 Next steps:");
  console.log("1. Add ESCROW_CONTRACT_ADDRESS to .env.local");
  console.log("2. Add NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS to .env.local");
  console.log("3. Restart your dev server");
  console.log("4. Test the payment flow!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error.message);
    process.exit(1);
  });


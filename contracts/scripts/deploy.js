async function main(hre) {
  const merchantWallet = process.env.MERCHANT_WALLET_ADDRESS;
  
  if (!merchantWallet) {
    throw new Error("MERCHANT_WALLET_ADDRESS not set in .env.local");
  }
  
  console.log("🚀 Deploying X402Escrow...");
  console.log("   Merchant Wallet:", merchantWallet);
  console.log("   Network: Base Sepolia");
  
  const X402Escrow = await hre.ethers.getContractFactory("X402Escrow");
  const escrow = await X402Escrow.deploy(merchantWallet);
  
  await escrow.waitForDeployment();
  
  const address = await escrow.getAddress();
  
  console.log("\n✅ X402Escrow deployed to:", address);
  console.log("\n📝 Add to .env.local:");
  console.log(`ESCROW_CONTRACT_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=${address}`);
  
  const timeout = await escrow.TIMEOUT();
  console.log("\n⏱️  Payment timeout:", timeout.toString(), "seconds (15 minutes)");
  
  console.log("\n🎯 Next steps:");
  console.log("1. Add ESCROW_CONTRACT_ADDRESS to .env.local");
  console.log("2. Add NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS to .env.local");
  console.log("3. Restart your dev server");
  console.log("4. Test the payment flow!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


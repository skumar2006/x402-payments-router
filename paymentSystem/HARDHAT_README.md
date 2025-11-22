# Hardhat Setup Note

The current Hardhat version (2.27.0) requires ESM modules and Node.js 22+.

## Option 1: Use Foundry Instead (Recommended for this project)

Foundry is faster and works with the current setup:

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Compile
forge build

# Test
forge test

# Deploy
forge script scripts/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC --broadcast
```

## Option 2: Compile contract manually

The contract is already written and the ABI is manually created in `lib/escrowABI.ts`.
You can deploy it using:
1. Remix IDE (https://remix.ethereum.org)
2. Hardhat Dashboard
3. Direct ethers.js script

## Option 3: Upgrade Node.js

```bash
# Using nvm
nvm install 22
nvm use 22

# Then run
npx hardhat compile
npx hardhat test
```

## For Now

The contract ABI is already in `lib/escrowABI.ts` and ready to use.
You can deploy the contract using Remix or when you upgrade Node.js.

The contract source is in `contracts/X402Escrow.sol`.


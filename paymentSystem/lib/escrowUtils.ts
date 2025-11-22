import { keccak256, toHex } from 'viem';

export function generateOrderId(paymentId: string): `0x${string}` {
  return keccak256(toHex(paymentId));
}

export function getEscrowContractAddress(): `0x${string}` {
  const address = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS || process.env.ESCROW_CONTRACT_ADDRESS;
  if (!address) {
    throw new Error('ESCROW_CONTRACT_ADDRESS not configured');
  }
  return address as `0x${string}`;
}

export const ESCROW_TIMEOUT_MS = 15 * 60 * 1000;


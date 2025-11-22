import { NextResponse } from 'next/server';

const AGENT_FEE = 2.00; // Fixed agent service fee

export async function GET() {
  return NextResponse.json({
    agentFee: AGENT_FEE,
    description: 'Fixed agent service fee. Total payment = agent fee + product price',
    currency: 'USDC',
    network: 'base',
  });
}


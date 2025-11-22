import { NextResponse } from 'next/server';

const AGENT_FEE = parseFloat(process.env.AGENT_FEE_USDC || '2.00');
const AGENT_API_ENDPOINT = process.env.AGENT_API_ENDPOINT || 'http://localhost:8000/agent/execute';

export async function GET() {
  return NextResponse.json({
    agentFee: AGENT_FEE,
    description: 'Fixed agent service fee. Total payment = agent fee + product price',
    currency: 'USDC',
    network: 'base',
    agentApiEndpoint: AGENT_API_ENDPOINT,
    configured: !!process.env.AGENT_API_ENDPOINT,
  });
}


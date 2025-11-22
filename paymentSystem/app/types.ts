export interface PaymentDetails {
  id: string;
  amount: string;
  currency: string;
  description: string;
  breakdown: {
    productPrice: string;
    agentFee: string;
    total: string;
  };
}

export interface PaymentResponse {
  error: string;
  payment: PaymentDetails;
  message: string;
}

export interface SuccessResponse {
  success: boolean;
  paymentId: string;
  amount: string;
  result: any;
}

export interface UserWallet {
  address: string;
  walletId: string;
}

export type PurchaseStatus = 
  | 'idle' 
  | 'pending' 
  | 'payment_required' 
  | 'confirming_payment' 
  | 'verifying_payment' 
  | 'success' 
  | 'error';

export interface PurchaseState {
  status: PurchaseStatus;
  statusTitle: string;
  statusMessage?: string;
  paymentData?: PaymentResponse;
  resultData?: SuccessResponse;
  error?: string;
  query: string;
}


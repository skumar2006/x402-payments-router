"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2,
  Wallet,
  Smartphone,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  CreditCard,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface PaymentResponse {
  error: string;
  payment: {
    id: string;
    amount: string;
    currency: string;
    description: string;
    breakdown: {
      productPrice: string;
      agentFee: string;
      total: string;
    };
    orderId?: string;
  };
  message: string;
}

interface SuccessResponse {
  success: boolean;
  paymentId: string;
  amount: string;
  result: any;
  escrowStatus?: string;
  agentTransactionId?: string;
}

export default function Home() {
  // User setup state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userWallet, setUserWallet] = useState<{
    address: string;
    walletId: string;
  } | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [walletBalance, setWalletBalance] = useState<Record<string, string>>(
    {}
  );
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Purchase flow state
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [statusTitle, setStatusTitle] = useState("");
  const [statusContent, setStatusContent] = useState<any>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [currentPaymentData, setCurrentPaymentData] = useState<any>(null);
  const [showCopied, setShowCopied] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const AGENT_FEE = 0.001; // Fixed agent fee in ETH

  const copyTopUpLink = () => {
    if (userWallet) {
      const link = `${window.location.origin}/topup/${userWallet.walletId}`;
      navigator.clipboard.writeText(link);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  const resetForm = () => {
    setQuery("");
    setStatus("idle");
    setStatusTitle("");
    setStatusContent(null);
    setCurrentPaymentId(null);
    setCurrentPaymentData(null);
    setIsDialogOpen(false);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingUp(true);

    try {
      const response = await fetch("/api/user/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setUserWallet({
          address: data.wallet.address,
          walletId: data.wallet.walletId,
        });
        console.log("✅ User wallet loaded:", data.wallet.address);

        // Fetch wallet balance
        await fetchWalletBalance(phoneNumber);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error: any) {
      alert("Failed to create wallet: " + error.message);
    } finally {
      setIsSettingUp(false);
    }
  };

  const fetchWalletBalance = async (phone: string) => {
    setLoadingBalance(true);
    try {
      const response = await fetch("/api/wallet/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setWalletBalance(data.balances || {});
      } else {
        console.error("Error fetching balance:", data.error);
      }
    } catch (error: any) {
      console.error("Failed to fetch balance:", error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handlePurchaseRequest();
  };

  const handlePurchaseRequest = async () => {
    setStatus("pending");
    setStatusTitle("Looking up product price...");
    setStatusContent({ loading: true, message: "Analyzing your request..." });
    setIsDialogOpen(true);

    try {
      // Step 1: Request agent service (will get 402)
      // Agent will look up the price automatically
      const response = await fetch("/api/agent/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: {
            query: query,
          },
        }),
      });

      const data = await response.json();

      if (response.status === 402) {
        // Payment required - store payment data for later
        setCurrentPaymentId(data.payment.id);
        setCurrentPaymentData(data);
        showPaymentRequired(data);
      } else if (response.ok) {
        showSuccess(data);
      } else {
        showError("Request failed: " + data.error);
      }
    } catch (error: any) {
      showError("Network error: " + error.message);
    }
  };

  const showPaymentRequired = (data: PaymentResponse) => {
    setStatus("pending");
    setStatusTitle("Payment Required");

    setStatusContent({
      payment: data.payment,
      message: data.message,
      waitingForPayment: true,
      useCDPWallet: true,
      userWalletAddress: userWallet?.address,
    });
  };

  const handleManualPayment = () => {
    // Check if user has a CDP wallet
    if (!userWallet) {
      showError("No user wallet found");
      return;
    }

    // Get payment amount from current payment data
    if (!currentPaymentData || !currentPaymentData.payment) {
      showError("No payment data available");
      return;
    }

    const amount = currentPaymentData.payment.amount;
    const orderId = currentPaymentData.payment.orderId;

    if (!orderId) {
      showError("No order ID found in payment data");
      return;
    }

    // Use CDP wallet to make payment (no external wallet required!)
    sendCDPWalletPayment(amount, orderId);
  };

  const sendCDPWalletPayment = async (amount: string, orderId: string) => {
    if (!userWallet) {
      showError("No user wallet found");
      return;
    }

    if (!currentPaymentId) {
      showError("No payment ID available");
      return;
    }

    setStatus("pending");
    setStatusTitle("Processing Payment");
    setStatusContent({
      processing: true,
      message:
        "Using your CDP wallet to make payment. No external wallet required!",
    });

    try {
      console.log("📤 Creating escrow payment from CDP wallet...");
      console.log("   Order ID:", orderId);
      console.log("   Amount:", amount, "ETH");
      console.log("   Phone Number:", phoneNumber);

      // Call our API to invoke the contract from CDP wallet
      const response = await fetch("/api/cdp-wallet/transfer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          amount: amount,
          orderId: orderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Transfer failed");
      }

      console.log("✅ CDP wallet payment successful:", data);

      // Submit payment proof with the transaction hash
      await submitPaymentProofFromCDP(data.transactionHash);
    } catch (error: any) {
      console.error("❌ CDP wallet payment error:", error);
      showError("Payment failed: " + error.message);
    }
  };

  const submitPaymentProofFromCDP = async (txHash: string) => {
    setStatus("pending");
    setStatusTitle("Verifying Payment");
    setStatusContent({
      processing: true,
      message: "Confirming transaction on-chain...",
    });

    try {
      // Create payment proof with CDP wallet transaction hash
      const paymentProof = {
        paymentId: currentPaymentId!,
        transactionHash: txHash,
        from: userWallet!.address,
        signature: txHash,
      };

      // Submit payment and execute agent workflow
      const response = await fetch("/api/agent/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: {
            query: query,
          },
          paymentProof,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess(data);
        // Refresh balance after successful payment
        await fetchWalletBalance(phoneNumber);
      } else {
        showError("Payment verification failed: " + data.error);
      }
    } catch (error: any) {
      showError("Payment error: " + error.message);
    }
  };

  const showSuccess = (data: SuccessResponse) => {
    setStatus("success");
    setStatusTitle("Workflow Complete");
    setStatusContent(data);
  };

  const showError = (message: string) => {
    setStatus("error");
    setStatusTitle("Error");
    setStatusContent({ error: message });
  };

  // Show phone number input first if user hasn't set up wallet
  if (!userWallet) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50">
        <Card className="w-full max-w-md border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-serif">
              x402 Purchasing Agent
            </CardTitle>
            <CardDescription>
              Enter your phone number to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  required
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <span className="mt-0.5">💡</span>
                  We'll create a secure wallet for you using Coinbase CDP. Your
                  wallet will be linked to this phone number.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base"
                disabled={isSettingUp}
              >
                {isSettingUp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Wallet...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50/50 max-w-4xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">
            x402 Purchasing Agent
          </h1>
          <p className="text-muted-foreground">
            CDP Wallet powered by Coinbase
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetForm();
              setUserWallet(null);
              setPhoneNumber("");
            }}
          >
            Log Out
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Info Card */}
        <Card className="md:col-span-1 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Your Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-secondary/50 p-3 rounded-md space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Address
              </p>
              <p className="font-mono text-sm break-all">
                {userWallet.address.slice(0, 6)}...
                {userWallet.address.slice(-4)}
              </p>
            </div>

            <div className="bg-secondary/50 p-3 rounded-md space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Balance
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => fetchWalletBalance(phoneNumber)}
                  disabled={loadingBalance}
                >
                  <RefreshCw
                    className={cn("h-3 w-3", loadingBalance && "animate-spin")}
                  />
                </Button>
              </div>

              {loadingBalance ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : Object.keys(walletBalance).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(walletBalance).map(([asset, amount]) => (
                    <div key={asset} className="flex justify-between text-sm">
                      <span className="font-medium">{asset}</span>
                      <span>{parseFloat(amount).toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">0.00</p>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs"
                    onClick={() =>
                      (window.location.href = `/topup/${userWallet.walletId}`)
                    }
                  >
                    Top up wallet
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a href={`/topup/${userWallet.walletId}`}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Top Up
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={copyTopUpLink}
              >
                {showCopied ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {showCopied ? "Link Copied" : "Copy Top-Up Link"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Purchase Form */}
        <Card className="md:col-span-2 shadow-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              New Request
            </CardTitle>
            <CardDescription>
              The agent will automatically look up prices and process payments
              securely.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                Payment Structure
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Agent Service Fee
                  </span>
                  <span className="font-mono">{AGENT_FEE.toFixed(3)} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product Cost</span>
                  <span className="italic">Calculated by Agent</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total Payment</span>
                  <span>Fee + Cost</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="query">What would you like to buy?</Label>
                <Textarea
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., USB-C charger, headphones, laptop..."
                  required
                  className="min-h-[120px] resize-none text-base"
                />
              </div>

              <Button type="submit" className="w-full h-12 text-lg font-medium">
                Request Agent Service
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-muted/20 border-t flex justify-center gap-4 py-4 flex-wrap">
            <a
              href="/topup-demo"
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              Top-Up Demo <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="/test-escrow"
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              Test Escrow <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="/test-scenarios"
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              Test Scenarios <ExternalLink className="h-3 w-3" />
            </a>
          </CardFooter>
        </Card>
      </div>

      {/* Status Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          // Only allow closing if not processing/loading
          if (!open && status !== "pending") {
            setIsDialogOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{statusTitle}</DialogTitle>
            <DialogDescription>
              {status === "pending"
                ? "Please wait while we process your request."
                : "Action completed."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <StatusContent
              status={status}
              content={statusContent}
              onPayNow={handleManualPayment}
            />
          </div>

          <DialogFooter className="sm:justify-between gap-2">
            {status === "error" && (
              <Button
                variant="secondary"
                onClick={() => setIsDialogOpen(false)}
                className="w-full"
              >
                Close
              </Button>
            )}
            {status === "success" && (
              <Button onClick={() => setIsDialogOpen(false)} className="w-full">
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusContent({
  status,
  content,
  onPayNow,
}: {
  status: string;
  content: any;
  onPayNow?: () => void;
}) {
  if (!content) return null;

  if (content.loading || (content.processing && !content.payment)) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-center text-muted-foreground">
          {content.message || "Processing..."}
        </p>
      </div>
    );
  }

  if (content.payment && content.waitingForPayment) {
    return (
      <div className="space-y-6">
        <div className="bg-secondary/30 p-4 rounded-lg space-y-3 border">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Product Cost</span>
            <span className="font-mono">
              {content.payment.breakdown.productPrice} ETH
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Agent Fee</span>
            <span className="font-mono">
              {content.payment.breakdown.agentFee} ETH
            </span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="font-mono text-lg font-bold text-primary">
              {content.payment.breakdown.total} ETH
            </span>
          </div>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <Wallet className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Pay with CDP Wallet</AlertTitle>
          <AlertDescription className="text-blue-700 text-xs">
            Payment will be made directly from your connected CDP wallet. No
            external signature required.
          </AlertDescription>
        </Alert>

        <Button onClick={onPayNow} className="w-full h-12 text-lg">
          Confirm Payment
        </Button>
      </div>
    );
  }

  if (content.processing && content.message) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-center text-muted-foreground">{content.message}</p>
      </div>
    );
  }

  if (content.success) {
    const isConfirmed = content.escrowStatus === "confirmed";
    const isPending =
      content.escrowStatus === "failed" ||
      content.escrowStatus === "disabled_for_testing" ||
      content.escrowStatus === "pending";

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
            <span className="text-sm font-medium">Status</span>
            {isConfirmed ? (
              <Badge
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                PAID
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
              >
                ESCROW PENDING
              </Badge>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground text-center">
              Payment ID
            </p>
            <p className="font-mono text-xs text-center bg-secondary p-1 rounded">
              {content.paymentId}
            </p>
          </div>

          {isPending && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">
                Escrow Status: {content.escrowStatus}
              </AlertTitle>
              <AlertDescription className="text-yellow-700 text-xs mt-1">
                Funds are locked in escrow. If not confirmed in 15m, you can
                request a refund.
              </AlertDescription>
            </Alert>
          )}

          {content.result && (
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-sm">
                <ShoppingBag className="h-4 w-4" /> Order Details
              </h4>
              <ResultDetails result={content.result} />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (content.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{content.error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <pre className="bg-secondary p-2 rounded text-xs overflow-auto">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}

function ResultDetails({ result }: { result: any }) {
  // For the new OpenAI-powered agent response
  if (result.transactionId) {
    return (
      <div className="space-y-2 text-sm">
        {result.product && (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product</span>
              <span className="font-medium">{result.product.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span>
                {result.product.priceUSD
                  ? `$${result.product.priceUSD}`
                  : result.product.price}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vendor</span>
              <span>{result.product.vendor}</span>
            </div>
          </>
        )}
        {result.aiConfirmation && (
          <div className="mt-2 p-2 bg-secondary/50 rounded text-xs italic text-muted-foreground border-l-2 border-primary">
            🤖 {result.aiConfirmation}
          </div>
        )}
      </div>
    );
  }

  // Legacy response format fallback
  if (result.orderId) {
    return (
      <div className="space-y-1 text-sm">
        <p>
          <strong>Order ID:</strong> {result.orderId}
        </p>
        <p>
          <strong>Product:</strong> {result.product.name}
        </p>
        <p>
          <strong>Price:</strong> {result.product.price}
        </p>
        <p className="text-muted-foreground text-xs">{result.message}</p>
      </div>
    );
  }

  if (result.results) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">
          Found {result.resultsCount} products:
        </p>
        <ul className="list-disc list-inside text-xs space-y-1">
          {result.results.map((r: any, i: number) => (
            <li key={i}>
              {r.name} - {r.price}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}


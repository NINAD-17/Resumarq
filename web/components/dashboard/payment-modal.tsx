"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentModalProps {
  onClose: () => void;
  onSuccess: (newQuota?: number) => void;
}

export function PaymentModal({ onClose, onSuccess }: PaymentModalProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (type: "per_analysis" | "subscription") => {
    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate payment");
      }

      // Load Razorpay Script dynamically if not already loaded
      if (!(window as any).Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      const options: any = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Resumarq",
        description: type === "subscription" ? "Monthly Subscription" : "1x Resume Analysis",
        handler: async function (response: any) {
          setIsProcessing(true);
          setError(null);
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Payment verification failed");
            }

            onSuccess(verifyData.quotaRemaining);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Verification failed");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#0f172a", // Match your app theme (foreground)
        },
      };

      if (type === "subscription") {
        options.subscription_id = data.subscriptionId;
        delete options.amount;
        delete options.currency;
      } else {
        options.order_id = data.orderId;
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError("Payment failed. Please try again.");
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="relative w-full max-w-md border-primary/20 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-accent cursor-pointer z-10"
        >
          <X className="size-4" />
        </button>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">Purchase an Analysis</CardTitle>
          <CardDescription className="text-base">
            You've run out of free analyses. Purchase an analysis to continue getting AI-powered insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {error && (
            <div className="mb-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive text-center">
              {error}
            </div>
          )}
          
          <div className="grid gap-6">
            {/* Pay Per Analysis */}
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col hover:border-primary/50 transition-colors">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Pay Per Analysis</h3>
                <div className="mt-2 flex items-baseline text-3xl font-bold">
                  ₹40
                  <span className="ml-1 text-sm font-normal text-muted-foreground">/ analysis</span>
                </div>
              </div>
              <ul className="mb-6 flex-1 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> Full Resume Audit
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> JD Matching
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> No recurring fees
                </li>
              </ul>
              <Button
                className="w-full cursor-pointer"
                onClick={() => handleCheckout("per_analysis")}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Pay ₹40"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

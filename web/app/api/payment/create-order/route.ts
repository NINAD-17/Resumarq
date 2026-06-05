import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { razorpay } from "@/lib/razorpay";
import { insertPayment } from "@/lib/db/payments";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    
    const body = await request.json();
    const { type } = body;
    
    if (type !== "per_analysis" && type !== "subscription") {
      return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
    }

    if (type === "per_analysis") {
      const amountPaise = 4000; // ₹40
      const currency = "INR";
      const receiptId = `rcpt_${Date.now()}_${userId.slice(-6)}`;
      
      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: currency,
        receipt: receiptId,
      });
      
      await insertPayment({
        userId,
        razorpayOrderId: order.id,
        type: "per_analysis",
        amountPaise,
        currency,
        quotaAdded: 1,
        status: "created",
      });
      
      return NextResponse.json({
        orderId: order.id,
        amount: amountPaise,
        currency: currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        type: "per_analysis",
      });
    } else {
      // Monthly subscription flow
      const planId = process.env.RAZORPAY_PLAN_ID_MONTHLY;
      if (!planId || planId.startsWith("plan_xxxx")) {
        return NextResponse.json({ error: "Subscription plan not configured" }, { status: 500 });
      }
      
      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        total_count: 120, // 10 years
      });
      
      // For subscriptions, Razorpay returns a subscription ID.
      // We store it as the "orderId" in our generic payments table for simplicity,
      // or we handle subscriptions slightly differently. Let's store subscription.id.
      await insertPayment({
        userId,
        razorpayOrderId: subscription.id,
        razorpaySubscriptionId: subscription.id,
        type: "subscription",
        amountPaise: 20000, // ₹200
        currency: "INR",
        quotaAdded: 10,
        status: "created",
      });

      return NextResponse.json({
        subscriptionId: subscription.id,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        type: "subscription",
      });
    }
    
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { verifyPaymentSignature } from "@/lib/razorpay";
import crypto from "crypto";
import { findByOrderId, updatePaymentStatus } from "@/lib/db/payments";
import { addQuota, setSubscription } from "@/lib/db/user-profiles";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const body = await request.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = body;

    if (!razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    let isValid = false;
    let orderId = "";
    let isSubscription = false;

    if (razorpay_order_id) {
      // Standard order verification
      orderId = razorpay_order_id;
      isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    } else if (razorpay_subscription_id) {
      // Subscription verification
      orderId = razorpay_subscription_id;
      isSubscription = true;
      const payload = razorpay_payment_id + "|" + razorpay_subscription_id;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
      isValid = (expectedSignature === razorpay_signature);
    } else {
      return NextResponse.json({ error: "Missing order_id or subscription_id" }, { status: 400 });
    }

    if (!isValid) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // Success! Update payment record and quota
    const payment = await findByOrderId(orderId);
    if (!payment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    // Guard: check if already processed (webhook might have run first)
    if (payment.status !== "paid") {
      await updatePaymentStatus(orderId, "paid", razorpay_payment_id);
      
      if (isSubscription) {
        // Default subscription duration is 30 days
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await addQuota(userId, 10);
        await setSubscription(userId, orderId, "active", periodEnd);
      } else {
        await addQuota(userId, payment.quotaAdded);
      }
    }

    // Fetch the updated quota
    const { getQuota } = await import("@/lib/db/user-profiles");
    const quotaRemaining = await getQuota(userId);

    return NextResponse.json({
      success: true,
      quotaRemaining,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

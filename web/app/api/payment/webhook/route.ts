import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { updatePaymentStatus, findByOrderId } from "@/lib/db/payments";
import { addQuota, setSubscription } from "@/lib/db/user-profiles";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Must read raw text for webhook signature verification
    const rawBody = await request.text();
    
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error("Invalid Razorpay webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    switch (event.event) {
      case "payment.captured": {
        const paymentData = event.payload.payment.entity;
        const orderId = paymentData.order_id;
        
        if (orderId) {
          const payment = await findByOrderId(orderId);
          if (payment && payment.status !== "paid") {
            await updatePaymentStatus(orderId, "paid", paymentData.id);
            await addQuota(payment.userId, payment.quotaAdded);
          }
        }
        break;
      }
      
      case "subscription.activated": {
        const subData = event.payload.subscription.entity;
        const subId = subData.id;
        
        // Find the payment record created during checkout
        const payment = await findByOrderId(subId);
        if (payment && payment.status !== "paid") {
          await updatePaymentStatus(subId, "paid");
          await addQuota(payment.userId, 10); // Initial 10 quota
          await setSubscription(
            payment.userId, 
            subId, 
            "active",
            new Date(subData.current_end * 1000)
          );
        }
        break;
      }
      
      case "subscription.charged": {
        const subData = event.payload.subscription.entity;
        const subId = subData.id;
        
        // This handles recurring charges (renewals)
        // Find user by subscription ID to add quota. We don't have a direct userId here
        // without querying userProfiles or parsing notes. In a real system, we'd query
        // userProfiles by subscriptionId. Let's do a simple update:
        const { clientPromise } = await import("@/lib/db");
        const client = await clientPromise;
        const userProfile = await client.db().collection("userProfiles").findOne({ subscriptionId: subId });
        
        if (userProfile) {
          await addQuota(userProfile.userId, 10); // Add next month's 10 quota
          await setSubscription(
            userProfile.userId,
            subId,
            "active",
            new Date(subData.current_end * 1000)
          );
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.halted": {
        const subData = event.payload.subscription.entity;
        const subId = subData.id;
        const { clientPromise } = await import("@/lib/db");
        const client = await clientPromise;
        const userProfile = await client.db().collection("userProfiles").findOne({ subscriptionId: subId });
        
        if (userProfile) {
          await setSubscription(
            userProfile.userId,
            subId,
            event.event === "subscription.cancelled" ? "cancelled" : "halted"
          );
        }
        break;
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

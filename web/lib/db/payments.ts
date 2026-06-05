import { clientPromise } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { Collection } from "mongodb";

const COLLECTION = "payments";

export interface PaymentDocument {
  _id: ObjectId;
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySubscriptionId?: string;
  type: "per_analysis" | "subscription";
  amountPaise: number;
  currency: "INR";
  quotaAdded: number;
  status: "created" | "paid" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

async function getCollection(): Promise<Collection<PaymentDocument>> {
  const client = await clientPromise;
  return client.db().collection<PaymentDocument>(COLLECTION);
}

/**
 * Ensure indexes exist.
 */
export async function ensurePaymentIndexes(): Promise<void> {
  const col = await getCollection();
  await col.createIndex({ userId: 1, createdAt: -1 });
  await col.createIndex({ razorpayOrderId: 1 }, { unique: true });
}

/**
 * Insert a new payment record (initial state "created").
 */
export async function insertPayment(
  data: Omit<PaymentDocument, "_id" | "createdAt" | "updatedAt">
): Promise<PaymentDocument> {
  const col = await getCollection();
  const now = new Date();
  
  const doc: Omit<PaymentDocument, "_id"> = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  
  const result = await col.insertOne(doc as PaymentDocument);
  return { ...doc, _id: result.insertedId } as PaymentDocument;
}

/**
 * Update the status of a payment (e.g. after successful capture via webhook).
 */
export async function updatePaymentStatus(
  razorpayOrderId: string,
  status: PaymentDocument["status"],
  razorpayPaymentId?: string
): Promise<void> {
  const col = await getCollection();
  
  const update: any = {
    status,
    updatedAt: new Date(),
  };

  if (razorpayPaymentId) {
    update.razorpayPaymentId = razorpayPaymentId;
  }

  await col.updateOne(
    { razorpayOrderId },
    { $set: update }
  );
}

/**
 * Find a payment by its Razorpay Order ID.
 * Useful for idempotency checks in the webhook.
 */
export async function findByOrderId(razorpayOrderId: string): Promise<PaymentDocument | null> {
  const col = await getCollection();
  return col.findOne({ razorpayOrderId });
}

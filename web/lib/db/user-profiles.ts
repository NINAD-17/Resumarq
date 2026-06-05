import { clientPromise } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { Collection } from "mongodb";

const COLLECTION = "userProfiles";

export interface UserProfileDocument {
  _id: ObjectId;
  userId: string;
  quotaRemaining: number;
  plan: "free" | "per_analysis" | "monthly";
  razorpayCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: "created" | "authenticated" | "active" | "pending" | "halted" | "cancelled" | "completed" | "expired";
  subscriptionCurrentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

async function getCollection(): Promise<Collection<UserProfileDocument>> {
  const client = await clientPromise;
  return client.db().collection<UserProfileDocument>(COLLECTION);
}

/**
 * Ensure indexes exist (call once during init or on first access).
 */
export async function ensureUserProfileIndexes(): Promise<void> {
  const col = await getCollection();
  await col.createIndex({ userId: 1 }, { unique: true });
}

/**
 * Get a user profile, creating it with default quota if it doesn't exist.
 */
export async function getOrCreateProfile(userId: string): Promise<UserProfileDocument> {
  const col = await getCollection();
  let profile = await col.findOne({ userId });

  if (!profile) {
    const now = new Date();
    const newProfile: Omit<UserProfileDocument, "_id"> = {
      userId,
      quotaRemaining: 0, // 0 free analyses for new users (pay per analysis)
      plan: "free",
      createdAt: now,
      updatedAt: now,
    };
    
    const result = await col.insertOne(newProfile as UserProfileDocument);
    profile = { ...newProfile, _id: result.insertedId } as UserProfileDocument;
  }

  return profile;
}

/**
 * Atomically deduct 1 from quotaRemaining if it is > 0.
 * Returns true if deduction was successful, false if quota was 0.
 */
export async function deductQuota(userId: string): Promise<boolean> {
  // Ensure profile exists (gives 1 free quota to new users)
  await getOrCreateProfile(userId);

  const col = await getCollection();
  
  // We use findOneAndUpdate to atomically check quota > 0 and decrement
  const result = await col.findOneAndUpdate(
    { userId, quotaRemaining: { $gt: 0 } },
    { 
      $inc: { quotaRemaining: -1 },
      $set: { updatedAt: new Date() }
    },
    { returnDocument: 'after' }
  );

  return result !== null;
}

/**
 * Add quota to a user's account.
 */
export async function addQuota(userId: string, amount: number): Promise<void> {
  const col = await getCollection();
  await col.updateOne(
    { userId },
    { 
      $inc: { quotaRemaining: amount },
      $set: { updatedAt: new Date() }
    }
  );
}

/**
 * Get current quota for a user.
 */
export async function getQuota(userId: string): Promise<number> {
  const profile = await getOrCreateProfile(userId);
  return profile.quotaRemaining;
}

/**
 * Update subscription details for a user.
 */
export async function setSubscription(
  userId: string,
  subscriptionId: string,
  status: UserProfileDocument["subscriptionStatus"],
  periodEnd?: Date
): Promise<void> {
  const col = await getCollection();
  
  const update: any = {
    subscriptionId,
    subscriptionStatus: status,
    updatedAt: new Date(),
  };

  if (periodEnd) {
    update.subscriptionCurrentPeriodEnd = periodEnd;
  }

  if (status === "active") {
    update.plan = "monthly";
  } else if (status === "cancelled" || status === "expired") {
    // Revert to free plan if subscription ends
    update.plan = "free";
  }

  await col.updateOne(
    { userId },
    { $set: update }
  );
}

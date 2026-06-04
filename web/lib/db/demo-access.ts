import { clientPromise } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { Collection } from "mongodb";

const COLLECTION = "demoAccess";

export interface DemoAccessDocument {
  _id: ObjectId;
  ip: string;
  recruiterToken: string;
  analysisId?: string;
  usedAt?: Date;
  createdAt: Date;
}

async function getCollection(): Promise<Collection<DemoAccessDocument>> {
  const client = await clientPromise;
  return client.db().collection<DemoAccessDocument>(COLLECTION);
}

/**
 * Ensure indexes exist (call once during init or on first access).
 * Includes a TTL index to auto-delete recruiter records after 30 days.
 */
export async function ensureDemoAccessIndexes(): Promise<void> {
  const col = await getCollection();
  await col.createIndex({ ip: 1, recruiterToken: 1 }, { unique: true });
  // Auto-delete records after 30 days (cleanup recruiter data)
  await col.createIndex({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
}

/**
 * Find an existing demo access record by IP and token.
 */
export async function findDemoAccess(
  ip: string,
  recruiterToken: string,
): Promise<DemoAccessDocument | null> {
  const col = await getCollection();
  return col.findOne({ ip, recruiterToken });
}

/**
 * Create a new demo access record.
 * Throws if a record with this IP+token already exists (unique index).
 */
export async function createDemoAccess(
  ip: string,
  recruiterToken: string,
): Promise<DemoAccessDocument> {
  const col = await getCollection();
  const now = new Date();
  const doc: Omit<DemoAccessDocument, "_id"> = {
    ip,
    recruiterToken,
    createdAt: now,
  };
  const result = await col.insertOne(doc as DemoAccessDocument);
  return { ...doc, _id: result.insertedId } as DemoAccessDocument;
}

/**
 * Mark a demo access record as used (set the analysisId and usedAt fields).
 */
export async function markDemoAccessUsed(
  ip: string,
  recruiterToken: string,
  analysisId: string,
): Promise<void> {
  const col = await getCollection();
  await col.updateOne(
    { ip, recruiterToken },
    { $set: { analysisId, usedAt: new Date() } },
  );
}

/**
 * Check if the recruiter IP has already used their free analysis.
 */
export async function hasUsedFreeAnalysis(
  ip: string,
  recruiterToken: string,
): Promise<boolean> {
  const record = await findDemoAccess(ip, recruiterToken);
  return !!record?.usedAt;
}

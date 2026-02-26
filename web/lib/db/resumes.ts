import { clientPromise } from "@/lib/db";
import type { Collection } from "mongodb";
import type { ResumeDocument, ResumeInsert } from "@/types/resume";

const COLLECTION = "resumes";

// DB name comes from MONGODB_URI — consistent with Better Auth's client.db()
async function getCollection(): Promise<Collection<ResumeDocument>> {
  const client = await clientPromise;
  return client.db().collection<ResumeDocument>(COLLECTION);
}

export async function insertResume(
  data: ResumeInsert,
): Promise<ResumeDocument> {
  const col = await getCollection();
  const result = await col.insertOne(data as ResumeDocument);
  return { ...data, _id: result.insertedId } as ResumeDocument;
}

export async function getResumesByUser(
  userId: string,
): Promise<ResumeDocument[]> {
  const col = await getCollection();
  return col.find({ userId }).sort({ uploadedAt: -1 }).toArray();
}

export async function getResumeById(
  id: string,
  userId: string,
): Promise<ResumeDocument | null> {
  const col = await getCollection();
  const { ObjectId } = await import("mongodb");
  return col.findOne({ _id: new ObjectId(id), userId });
}

export async function deleteResumeById(
  id: string,
  userId: string,
): Promise<boolean> {
  const col = await getCollection();
  const { ObjectId } = await import("mongodb");
  const result = await col.deleteOne({ _id: new ObjectId(id), userId });
  return result.deletedCount === 1;
}

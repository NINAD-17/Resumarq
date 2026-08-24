import { clientPromise } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { Collection } from "mongodb";
import type { AnalysisDocument, AnalysisInsert } from "@/types/analysis";

const COLLECTION = "analyses";

async function getCollection(): Promise<Collection<AnalysisDocument>> {
  const client = await clientPromise;
  return client.db().collection<AnalysisDocument>(COLLECTION);
}

/** Ensure indexes exist on the analyses collection */
export async function ensureAnalysisIndexes(): Promise<void> {
  const col = await getCollection();
  await col.createIndex({ userId: 1, createdAt: -1 });
}

export async function insertAnalysis(
  data: AnalysisInsert,
): Promise<AnalysisDocument> {
  const col = await getCollection();
  const result = await col.insertOne(data as AnalysisDocument);
  return { ...data, _id: result.insertedId } as AnalysisDocument;
}

/** List analyses — includes essential metadata (jdText, title, scores) while omitting heavy audits */
export async function getAnalysesByUser(
  userId: string,
): Promise<AnalysisDocument[]> {
  const col = await getCollection();
  return col
    .find(
      { userId },
      {
        projection: {
          userId: 1,
          resumeId: 1,
          jdText: 1,
          status: 1,
          error: 1,
          createdAt: 1,
          updatedAt: 1,
          completedAt: 1,
          "results.title": 1,
          "results.scores": 1,
          "results.candidateName": 1,
        },
      }
    )
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getAnalysisById(
  id: string,
  userId: string,
): Promise<AnalysisDocument | null> {
  const col = await getCollection();
  return col.findOne({ _id: new ObjectId(id), userId });
}

/** Update the status of an analysis (called when status changes) */
export async function updateAnalysisStatus(
  id: string,
  status: AnalysisDocument["status"],
  update?: Partial<Pick<AnalysisDocument, "results" | "error" | "completedAt">>,
): Promise<void> {
  const col = await getCollection();
  await col.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status,
        updatedAt: new Date(),
        ...update,
      },
    },
  );
}

/** Reset a failed analysis back to pending status for retry */
export async function resetAnalysisForRetry(
  id: string,
  userId: string,
): Promise<boolean> {
  const col = await getCollection();
  const result = await col.updateOne(
    { _id: new ObjectId(id), userId, status: "failed" },
    {
      $set: {
        status: "pending",
        updatedAt: new Date(),
      },
      $unset: {
        error: "",
        results: "",
        completedAt: "",
      },
    },
  );
  return result.modifiedCount === 1;
}


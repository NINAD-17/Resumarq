import { clientPromise } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { Collection } from "mongodb";
import type { AnalysisDocument, AnalysisInsert } from "@/types/analysis";

const COLLECTION = "analyses";

async function getCollection(): Promise<Collection<AnalysisDocument>> {
  const client = await clientPromise;
  return client.db().collection<AnalysisDocument>(COLLECTION);
}

export async function insertAnalysis(
  data: AnalysisInsert,
): Promise<AnalysisDocument> {
  const col = await getCollection();
  const result = await col.insertOne(data as AnalysisDocument);
  return { ...data, _id: result.insertedId } as AnalysisDocument;
}

/** List analyses — excludes heavy fields (jdText, results) for performance */
export async function getAnalysesByUser(
  userId: string,
): Promise<AnalysisDocument[]> {
  const col = await getCollection();
  return col
    .find({ userId }, { projection: { jdText: 0, results: 0 } })
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

/** Update the status of an analysis (used by Inngest when processing starts/completes) */
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

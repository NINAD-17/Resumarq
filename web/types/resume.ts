import { ObjectId } from "mongodb";

/**
 * Resume document stored in MongoDB.
 *
 * Each resume is linked to a user and an S3 object.
 * The same resume can be reused across multiple analyses (cost saving).
 */
export interface ResumeDocument {
  _id: ObjectId;
  userId: string;

  // File metadata
  fileName: string; // Original file name (e.g. "ninad_resume_v3.pdf")
  fileSize: number; // In bytes
  mimeType: string; // "application/pdf"
  s3Key: string; // S3 object key for retrieval

  // Timestamps
  uploadedAt: Date;
}

/** Shape for creating a new resume (no _id yet) */
export type ResumeInsert = Omit<ResumeDocument, "_id">;

/** Shape returned to the client (serialized _id) */
export interface ResumeResponse {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

/** Convert a MongoDB document to a client-safe response */
export function toResumeResponse(doc: ResumeDocument): ResumeResponse {
  return {
    id: doc._id.toHexString(),
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    uploadedAt: doc.uploadedAt.toISOString(),
  };
}

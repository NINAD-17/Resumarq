import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

if (!process.env.AWS_ACCESS_KEY_ID) {
  throw new Error("Missing AWS_ACCESS_KEY_ID in environment variables");
}

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET_NAME!;

/**
 * Upload a file buffer to S3.
 * Returns the S3 key (path) of the uploaded file.
 *
 * Key format: resumes/{userId}/{timestamp}-{filename}
 */
export async function uploadToS3(
  buffer: Buffer,
  userId: string,
  fileName: string,
  contentType: string,
): Promise<string> {
  const key = `resumes/${userId}/${Date.now()}-${sanitizeFileName(fileName)}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return key;
}

/**
 * Delete a file from S3 by its key.
 */
export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  );
}

/**
 * Generate a presigned download URL for a file in S3.
 * URL expires after the specified duration (default: 1 hour).
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

/**
 * Get the raw file buffer from S3 (for passing to Gemini).
 */
export async function getFileFromS3(
  key: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  );

  const stream = response.Body;
  if (!stream) throw new Error("Empty response from S3");

  // Convert readable stream to Buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }

  return {
    buffer: Buffer.concat(chunks),
    contentType: response.ContentType || "application/pdf",
  };
}

/** Remove special characters from filenames to prevent S3 key issues */
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

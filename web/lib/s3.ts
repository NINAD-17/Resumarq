import { v2 as cloudinary } from "cloudinary";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ============================================================
// Storage Provider Selection ("s3" vs "cloudinary")
// Switch easily via STORAGE_PROVIDER=cloudinary or STORAGE_PROVIDER=s3
// ============================================================
export function getStorageProvider(): "s3" | "cloudinary" {
  if (process.env.STORAGE_PROVIDER === "cloudinary") return "cloudinary";
  if (process.env.STORAGE_PROVIDER === "s3") return "s3";
  if (process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_URL) {
    return "cloudinary";
  }
  return "s3";
}

// ── Cloudinary Configuration ────────────────────────────────
function initCloudinary() {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config();
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
}

// ── AWS S3 Configuration ────────────────────────────────────
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    if (!process.env.AWS_ACCESS_KEY_ID) {
      throw new Error("Missing AWS_ACCESS_KEY_ID in environment variables");
    }
    s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

function getBucketName(): string {
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  if (!bucket) {
    throw new Error("Missing AWS_S3_BUCKET_NAME in environment variables");
  }
  return bucket;
}

/**
 * Upload a file buffer to S3 or Cloudinary.
 * Returns the storage key / URL of the uploaded file.
 */
export async function uploadToS3(
  buffer: Buffer,
  userId: string,
  fileName: string,
  contentType: string,
): Promise<string> {
  const provider = getStorageProvider();

  // 1. Cloudinary Upload
  if (provider === "cloudinary") {
    initCloudinary();
    return new Promise((resolve, reject) => {
      const cleanName = sanitizeFileName(fileName).replace(/\.pdf$/i, "");
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: `resumarq/resumes/${userId}`,
          public_id: `${Date.now()}-${cleanName}.pdf`,
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Cloudinary upload failed"));
          } else {
            resolve(result.secure_url);
          }
        },
      );
      uploadStream.end(buffer);
    });
  }

  // 2. AWS S3 Upload
  const key = `resumes/${userId}/${Date.now()}-${sanitizeFileName(fileName)}`;
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return key;
}

/**
 * Delete a file from S3 or Cloudinary.
 */
export async function deleteFromS3(keyOrUrl: string): Promise<void> {
  const provider = getStorageProvider();

  // 1. Cloudinary Deletion
  if (provider === "cloudinary" || keyOrUrl.startsWith("http")) {
    initCloudinary();
    let publicId = keyOrUrl;
    if (keyOrUrl.startsWith("http")) {
      const parts = keyOrUrl.split("/upload/");
      if (parts.length > 1) {
        // Strip version prefix like v171234/
        publicId = parts[1].replace(/^v\d+\//, "");
      }
    }
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    return;
  }

  // 2. AWS S3 Deletion
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: keyOrUrl,
    }),
  );
}

/**
 * Generate a download URL for a file in S3 or Cloudinary.
 */
export async function getPresignedDownloadUrl(
  keyOrUrl: string,
  expiresInSeconds = 3600,
): Promise<string> {
  // If it's a Cloudinary URL or direct HTTP link, return directly
  if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
    return keyOrUrl;
  }

  // Otherwise generate AWS S3 presigned URL
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: keyOrUrl,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn: expiresInSeconds });
}

/**
 * Get raw file buffer from S3 or Cloudinary.
 */
export async function getFileFromS3(
  keyOrUrl: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  // 1. Cloudinary / HTTP URL
  if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
    const response = await fetch(keyOrUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from Cloudinary: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: response.headers.get("content-type") || "application/pdf",
    };
  }

  // 2. AWS S3
  const response = await getS3Client().send(
    new GetObjectCommand({
      Bucket: getBucketName(),
      Key: keyOrUrl,
    }),
  );

  const stream = response.Body;
  if (!stream) throw new Error("Empty response from S3");

  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }

  return {
    buffer: Buffer.concat(chunks),
    contentType: response.ContentType || "application/pdf",
  };
}

/** Remove special characters from filenames to prevent key/URL issues */
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

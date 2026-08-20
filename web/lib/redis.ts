import Redis from "ioredis";

/**
 * Resumarq Redis Client
 *
 * Provides a resilient singleton Redis connection used for enqueuing
 * asynchronous AI analysis jobs. Supports local Redis and Redis Cloud.
 */

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
export const ANALYSIS_QUEUE_NAME = process.env.REDIS_QUEUE_NAME || "resumarq:jobs";

// Global cache to prevent multiple Redis connections during Next.js hot-reloads in development
declare global {
  // eslint-disable-next-line no-var
  var __redisClient: Redis | undefined;
}

function createRedisClient(): Redis {
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    enableReadyCheck: true,
    retryStrategy(times) {
      // Exponential backoff with a cap of 2 seconds
      return Math.min(times * 100, 2000);
    },
    lazyConnect: true,
  });

  client.on("error", (err) => {
    console.error("[Redis Error]:", err.message);
  });

  client.on("connect", () => {
    console.log("[Redis] Connected to queue at:", REDIS_URL.split("@").pop());
  });

  return client;
}

export const redis = globalThis.__redisClient || createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__redisClient = redis;
}

export interface EnqueueAnalysisPayload {
  analysisId: string;
  resumeS3Key: string;
  jdText?: string | null;
}

/**
 * Enqueue a new resume analysis job to Redis.
 *
 * @param payload The job details to push into the queue
 * @returns The number of elements in the queue after the push operation
 */
export async function enqueueAnalysisJob(payload: EnqueueAnalysisPayload): Promise<number> {
  // Ensure connection is established (lazyConnect)
  if (redis.status === "wait") {
    await redis.connect();
  }

  const serialized = JSON.stringify(payload);
  const queueLength = await redis.lpush(ANALYSIS_QUEUE_NAME, serialized);
  console.log(`[Redis] Enqueued analysis ${payload.analysisId} to '${ANALYSIS_QUEUE_NAME}' (Queue depth: ${queueLength})`);
  return queueLength;
}

import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

const uri = process.env.MONGODB_URI;

declare global {
  var _mongoClient: MongoClient | undefined;
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Reuse existing client in development (survives hot reload)
const client: MongoClient = global._mongoClient || new MongoClient(uri);
const clientPromise: Promise<MongoClient> =
  global._mongoClientPromise ||
  client.connect().then(async (resolvedClient) => {
    // Dynamically import to avoid circular dependencies
    try {
      const [
        { ensureUserProfileIndexes },
        { ensurePaymentIndexes },
        { ensureDemoAccessIndexes },
        { ensureAnalysisIndexes },
        { ensureResumeIndexes },
      ] = await Promise.all([
        import("./db/user-profiles"),
        import("./db/payments"),
        import("./db/demo-access"),
        import("./db/analyses"),
        import("./db/resumes"),
      ]);

      await Promise.all([
        ensureUserProfileIndexes(),
        ensurePaymentIndexes(),
        ensureDemoAccessIndexes(),
        ensureAnalysisIndexes(),
        ensureResumeIndexes(),
      ]);
      console.log("Database indexes verified/created successfully.");
    } catch (err) {
      console.error("Error setting up database indexes:", err);
    }
    return resolvedClient;
  });

if (process.env.NODE_ENV === "development") {
  global._mongoClient = client;
  global._mongoClientPromise = clientPromise;
}

// `client` — raw MongoClient, auto-connects on first operation (used by better-auth)
// `clientPromise` — awaitable, ensures connection is established before use
export { client, clientPromise };

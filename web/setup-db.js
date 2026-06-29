require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

async function run() {
  if (!uri) {
    console.error("No MONGODB_URI found in .env");
    return;
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    
    console.log("Setting up database indexes...");

    // 1. analyses
    await db.collection("analyses").createIndex({ userId: 1, createdAt: -1 });
    console.log("Created index on collection: analyses");

    // 2. demoAccess
    await db.collection("demoAccess").createIndex({ ip: 1, recruiterToken: 1 }, { unique: true });
    await db.collection("demoAccess").createIndex({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
    console.log("Created indexes on collection: demoAccess");

    // 3. payments
    await db.collection("payments").createIndex({ userId: 1, createdAt: -1 });
    await db.collection("payments").createIndex({ razorpayOrderId: 1 }, { unique: true });
    console.log("Created indexes on collection: payments");

    // 4. resumes
    await db.collection("resumes").createIndex({ userId: 1, uploadedAt: -1 });
    console.log("Created index on collection: resumes");

    // 5. userProfiles
    await db.collection("userProfiles").createIndex({ userId: 1 }, { unique: true });
    console.log("Created index on collection: userProfiles");

    console.log("Database indexes verified/created successfully.");
  } catch (error) {
    console.error("Error setting up database indexes:", error);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);

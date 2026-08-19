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
    const result = await db.collection('userProfiles').updateMany(
      {},
      { $set: { quotaRemaining: 0 } }
    );
    console.log(`Updated ${result.modifiedCount} user profiles to have 0 quota.`);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);

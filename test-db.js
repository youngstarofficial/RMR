import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;

async function testConnection() {
  try {
    const client = new MongoClient(uri);
    await client.connect();

    console.log("✅ Connected to MongoDB");

    // Use your database
    const db = client.db("Newap");

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log("📂 Collections:", collections.map(c => c.name));

    // Optionally: test data from Apnew collection
    const sample = await db.collection("Apnew").findOne();
    console.log("🔎 Sample document from Apnew:", sample);

    await client.close();
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}

testConnection();

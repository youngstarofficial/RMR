import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });  

const uri = process.env.MONGODB_URI;

async function testConnection() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log("✅ Connected to MongoDB");
    const db = client.db("campus");
    const collections = await db.listCollections().toArray();
    console.log("📂 Collections:", collections.map(c => c.name));
    await client.close();
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}

testConnection();

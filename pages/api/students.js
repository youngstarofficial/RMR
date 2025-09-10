import { MongoClient } from "mongodb";

let client;

export default async function handler(req, res) {
  try {
    if (!client) {
      client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
    }

    const db = client.db("campus"); // Your database name
    const students = await db.collection("Students").find({}).toArray();

    console.log("Fetched Students Data:", students);  // Debug: Check structure in console

    res.status(200).json(students);
  } catch (err) {
    console.error("MongoDB error:", err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
}

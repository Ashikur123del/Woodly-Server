require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: '*', 
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(express.json());

const uri = process.env.MONGODB_URL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  
  try {
    await client.connect();
    const db = client.db('wanderlut'); 

    cachedDb = db;
    console.log("Connected to MongoDB Atlas (wanderlut)");

    return db;
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    throw error;
  }
}


app.get('/', (req, res) => {
  res.json({ message: 'Server is live and running' });
});


app.post("/orders", async (req, res) => {
  try {
    const database = await connectToDatabase();
    const collection = database.collection("destinations"); 
    const result = await collection.insertOne(req.body);
    res.status(201).json({ ...req.body, _id: result.insertedId });
  } catch (error) {
    console.error("POST Error:", error);
    res.status(500).json({ success: false, error: "Failed to save data" });
  }
});


app.get("/orders", async (req, res) => {
  try {
    const database = await connectToDatabase();
    const collection = database.collection("destinations"); 
    const result = await collection.find().toArray();
    res.json(result);
  } catch (error) {
    console.error("GET Error:", error);
    res.status(500).json({ success: false, error: "Could not fetch data" });
  }
});
 

app.get("/orders/:id", async (req, res) => {
  try {
    const database = await connectToDatabase();
    const collection = database.collection("destinations");
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const result = await collection.findOne({ _id: new ObjectId(id) });
    if (!result) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(result);
  } catch (error) {
    console.error("GET Single Order Error:", error);
    res.status(500).json({ success: false, error: "Could not fetch order" });
  }
});


app.patch("/orders/:id", async (req, res) => {
  try {
    const database = await connectToDatabase();
    const collection = database.collection("destinations");
    const id = req.params.id;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const { _id, ...updatedFields } = req.body;

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedFields }
    );
    res.json(result);
  } catch (error) {
    console.error("PATCH Error:", error);
    res.status(500).json({ success: false, error: "Update failed" });
  }
});


module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running locally on port ${port}`);
  });
}
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URL;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// মঙ্গোডিবি কানেকশন হ্যান্ডলার (Serverless এর জন্য সেরা উপায়)
let db;
async function connectDB() {
  if (db) return db; // আগে কানেক্ট করা থাকলে সেটিই ব্যবহার করবে
  await client.connect();
  db = client.db('wanderlut');
  return db;
}

// ১. রুট রাউট
app.get('/', (req, res) => {
  res.send('Server Running Perfectly');
});

// ২. ডাটা সেভ করা (POST)
app.post("/orders", async (req, res) => {
  try {
    const database = await connectDB();
    const destinationCollection = database.collection("destinations");
    const orderData = req.body;
    const result = await destinationCollection.insertOne(orderData);
    res.status(201).send({ ...orderData, _id: result.insertedId });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Order failed to save" });
  }
});

// ৩. ডাটা পড়া (GET)
app.get("/orders", async (req, res) => {
  try {
    const database = await connectDB();
    const destinationCollection = database.collection("destinations");
    const result = await destinationCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to fetch orders" });
  }
});

// ৪. ডাটা আপডেট (PATCH)
app.patch("/destination/:id", async (req, res) => {
  try {
    const database = await connectDB();
    const destinationCollection = database.collection("destinations");
    const id = req.params.id;
    const updateData = req.body;
    const result = await destinationCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// সার্ভার লিসেন (লোকালহোস্টের জন্য)
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server is running on port: ${port}`);
    });
}

// Vercel এর জন্য এক্সপোর্ট
module.exports = app;
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // সব ডোমেইন থেকে ডাটা এক্সেস অ্যালাউ করবে
  methods: ["GET", "POST", "PATCH", "DELETE"],
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

// মঙ্গোডিবি কানেকশন হ্যান্ডলার
let db;
async function connectDB() {
  if (db) return db;
  try {
    await client.connect();
    db = client.db('wanderlut'); // আপনার ডাটাবেস নাম
    console.log("Connected to MongoDB");
    return db;
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    throw err;
  }
}

// ১. রুট রাউট
app.get('/', (req, res) => {
  res.send('Server Running Perfectly');
});

// ২. ডাটা সেভ করা (POST)
app.post("/orders", async (req, res) => {
  try {
    const database = await connectDB();
    const ordersCollection = database.collection("orders"); // নাম পরিবর্তন করা হয়েছে
    const orderData = req.body;
    
    // ডাটাবেসে সেভ করার আগে টাইপ চেক (ঐচ্ছিক কিন্তু ভালো)
    const result = await ordersCollection.insertOne(orderData);
    res.status(201).send({ ...orderData, _id: result.insertedId });
  } catch (error) {
    console.error("POST Error:", error);
    res.status(500).send({ error: "Order failed to save" });
  }
});

// ৩. ডাটা পড়া (GET)
app.get("/orders", async (req, res) => {
  try {
    const database = await connectDB();
    const ordersCollection = database.collection("orders");
    const result = await ordersCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("GET Error:", error);
    res.status(500).send({ error: "Failed to fetch orders" });
  }
});

// ৪. ডাটা আপডেট (PATCH)
app.patch("/orders/:id", async (req, res) => { 
  try {
    const database = await connectDB();
    const ordersCollection = database.collection("orders");
    const id = req.params.id;
    const updateData = req.body;
    
    const { _id, ...updatedFields } = updateData; 

    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedFields }
    );
    res.json(result);
  } catch (error) {
    console.error("PATCH Error:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// লোকালহোস্টের জন্য
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server is running on port: ${port}`);
    });
}

// Vercel এর জন্য এক্সপোর্ট
module.exports = app;
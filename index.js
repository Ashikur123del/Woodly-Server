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

async function run() {
  try {
    // await client.connect(); // Production-এ এটি অপশনাল হতে পারে
    const db = client.db('wanderlut');
    const destinationCollection = db.collection("destinations");

    // ১. ডাটাবেসে নতুন অর্ডার সেভ করা (POST)
    app.post("/orders", async (req, res) => {
      try {
        const orderData = req.body;
        const result = await destinationCollection.insertOne(orderData);
        res.status(201).send({ ...orderData, _id: result.insertedId });
      } catch (error) {
        res.status(500).send({ error: "Order failed to save" });
      }
    });

    // ২. ডাটাবেস থেকে সব অর্ডার নিয়ে আসা (GET) - এটি ছাড়া ডাটা আসবে না
    app.get("/orders", async (req, res) => {
      try {
        const cursor = destinationCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch orders" });
      }
    });

    // ৩. আইডি দিয়ে আপডেট করা (PATCH)
    app.patch("/destination/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updateData = req.body;
        const result = await destinationCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );
        res.json(result);
      } catch (error) {
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    console.log("MongoDB Connected Successfully!");
  } catch (error) {
    console.error("Connection Error:", error);
  }
}
run().catch(console.dir);

app.get('/', (req, res) => { res.send('Server Running'); });
app.listen(port, () => { console.log(`Server is running on port: ${port}`); });
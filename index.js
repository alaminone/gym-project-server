const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")

// console.log('0909090', process.env.DB_SECRET_KEY)
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ufduuil.mongodb.net/?retryWrites=true&w=majority`;

console.log(process.env.DB_PASS)

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

  
    const usersCollection = client.db("gymproject").collection("users");
   

    // mideallwaaere

    const verifyToken = (req, res, next) => {
      console.log("inside token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "forbeden access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "forbidden access" });
        }

        req.decoded = decoded;
        next();
      });
    };

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      console.log(email);
      const query = { email: email };
      const users = await usersCollection.findOne(query);
      console.log("55", users);
      const isAdmin = users?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden accesss" });
      }
      next();
    };

    // // jwt token api

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // user info
    // verifyToken,
    app.get("/users",  async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.patch(
      "/users/admin/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            role: "admin",
          },
        };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
    );

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      // if(email !== req.decoded.email){
      //   return res.status(403).send({message: "unauthorizede access"})
      // }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existinguser = await usersCollection.findOne(query);
      if (existinguser) {
        return res.send({ message: "allredy exists", insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

   
    // payment system

    // app.post("/create-payment-intent", async (req, res) => {
    //   const { price } = req.body;
    //   const amount = parseInt(price * 100);
    //   console.log("taka", amount);

    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount: amount,
    //     currency: "usd",
    //     payment_method_types: ["card"],
    //   });

    //   res.send({
    //     clientSecret: paymentIntent.client_secret,
    //   });
    // });

    // // payments

    // app.get("/payments/:email", verifyToken, async (req, res) => {
    //   const query = { email: req.params.email };

    //   if (req.params.email !== req.decoded.email) {
    //     return res.status(403).send({ message: "fobeden" });
    //   }

    //   const result = await paymentCollection.find(query).toArray();
    //   res.send(result);
    // });

    // app.post("/payments", async (req, res) => {
    //   const payment = req.body;
    //   const paymentResult = await paymentCollection.insertOne(payment);

    //   // lalalala
    //   console.log("info", payment);
    //   const query = {
    //     _id: {
    //       $in: payment.cartIds.map((id) => new ObjectId(id)),
    //     },
    //   };
    //   const deleteResult = await cartsCollection.deleteMany(query);
    //   res.send({ paymentResult, deleteResult });
    // });

    
  





    // r=end

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Dhaka Spice House Resturent server is running");
});

app.listen(port, () => {
  console.log(`Dhaka Spice House Resturent server is running on port ${port}`);
});
const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// console.log('0909090', process.env.DB_SECRET_KEY)
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ufduuil.mongodb.net/?retryWrites=true&w=majority`;

console.log(process.env.DB_PASS);

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
    const classCollection = client.db("gymproject").collection("class");
    const galleryCollection = client.db("gymproject").collection("infinity");
    const successstoryCollection = client.db("gymproject").collection("successstory");
    const subscriberCollection = client.db("gymproject").collection("subscriber");

    const weeklyschduleCollection = client.db("gymproject").collection("weeklyschdule");

    // mideallwaaere

    const verifyToken = (req, res, next) => {
      // console.log("inside token", req.headers.authorization);
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

      const query = { email: email };
      const users = await usersCollection.findOne(query);

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
    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
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

    // trainer
    app.patch(
      "/users/trainer/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            role: "trainer",
          },
        };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
    );

    // handel trainerapplication

    app.put("/users/become/:email", async (req, res) => {
      const id = req.params.email;

      console.log("tt", id);

      const filter = { email: id };
      const updateDoc = {
        $set: {
          role: "trainer",
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);

      if (result.modifiedCount === 1) {
        res.status(200).json({ message: "User profile updated successfully" });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    });

    // member

    app.patch(
      "/users/member/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            role: "member",
          },
        };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
    );

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;

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

    app.post("/users/become/:email", async (req, res) => {
      const id = req.params.email;

      const filter = { email: id };

      const {
        application,
        name,
        email,
        Image,
        age,

        skills,
        availableTimeWeek,
        timeSlots,
        duration,
        Experience,
      } = req.body;

      const updateDoc = {
        $set: {
          application,
          name,
          email,
          Image,
          age,
          duration,
          skills,
          availableTimeWeek,
          timeSlots,
          Experience,
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);

      if (result.modifiedCount === 1) {
        res.status(200).json({ message: "User profile updated successfully" });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    });

    app.delete("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // classes
    app.get("/class", async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    });

    // successstory

    app.get("/successstory", async (req, res) => {
      const result = await successstoryCollection.find().toArray();
      res.send(result);
    });

    // trainer

    app.get("/trainers", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/trainers/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    // subscribe

    app.get("/subscriber", async (req, res) => {
      const result = await subscriberCollection.find().toArray();
      res.send(result);
    });

    app.post("/subscriber", async (req, res) => {
      const query = req.body;
      const result = await subscriberCollection.insertOne(query);
      res.send(result);
    });

    // rutin

    app.get("/weeklyschedule", async (req, res) => {
      const result = await weeklyschduleCollection.find().toArray();
      res.send(result);
    });

    // Gallery

    // app.get("/gallery", async (req, res) => {
    //   const limit = parseInt(req.query.limit) || 10;
    //   const offset = parseInt(req.query.offset) || 0;

    //   const result = await galleryCollection
    //   .find()
    //   .skip(offset)
    //   .limit(limit)
    //   .toArray();

    // res.send({
    //   result,

    // });
    // });

    // app.get('/gallery', async (req, res) => {
    //   try {
    //     const limit = parseInt(req.query.limit) || 10;
    //     const offset = parseInt(req.query.offset) || 0;

    //     const result = await galleryCollection.findOne().skip(offset).limit(limit);

    //     res.json(result);
    //   } catch (error) {
    //     console.error(error);
    //     res.status(500).send('Internal Server Error');
    //   }
    // });

    // r=end

    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
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

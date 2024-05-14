const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");

const port = process.env.PORT || 5000;
var jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

// MIDDLEWARE

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hv89ofo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// custom middleWare

async function run() {
  try {
    await client.connect();

    const jobCollection = client.db("jobDB").collection("jobs");
    const appliedCollection = client.db("jobDB").collection("applied");
    const blogCollection = client.db("BlogsDB").collection("blogs");

    //auth related api

    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log("user value is ", req.body);

      const token = jwt.sign(user, process.env.ACCES_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
        })
        .send({ sucess: true });
    });

 
    app.post("/logout", (req, res) => {
      console.log('logout backend is hitting now alhamdulillah');
      const user = req.body;
      console.log("clear method is now hited");

      res.clearCookie("token", { maxAge: 0 }).send({ sucess: true });
    });







    // services related auth

    // main area start
    app.get("/getJobCard", async (req, res) => {
      const result = await jobCollection.find().toArray();
      res.send(result);
    });

    app.get("/getTableCard", async (req, res) => {
      const search = req.query.search;

      const query = {
        jobTitle: { $regex: search, $options: "i" },
      };
      const options = {};

      const result = await jobCollection.find(query, options).toArray();
      res.send(result);
    });

    app.get("/finalcard/:id", async (req, res) => {
      const ids = req.params?.id;
      const query = { _id: new ObjectId(ids) };
      const result = await blogCollection.findOne(query);
      res.send(result);
    });

    app.post("/setApplied", async (req, res) => {
      const data = req.body;
      const result = await appliedCollection.insertOne(data);
      res.send(result);
    });

    app.patch("/inccount/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $inc: { applicantsNumber: 1 },
      };

      const result = await jobCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // main area end

    app.post("/jobpost", async (req, res) => {
      console.log("jobpost is now hitting alhamdulillah");
      const jobInfo = req.body;
      const result = await jobCollection.insertOne(jobInfo);
      res.send(result);
    });

    app.get("/getblogs", async (req, res) => {
      const result = await blogCollection.find().toArray();
      res.send(result);
    });
    app.get("/getjob/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.findOne(query);
      res.send(result);
    });

    app.get("/getmyjob/:userEmail", async (req, res) => {
      const userEmail = req.params.userEmail;
      const query = { userEmail: userEmail };
      const result = await jobCollection.find(query).toArray();
      res.send(result);
    });

    app.put("/updatedata/:id", async (req, res) => {
      const id = req.params.id;
      const defultData = req.body;
      const filter = { _id: new ObjectId(id) };

      const options = { upsert: true };

      const updateDoc = {
        $set: {
          bannarImg: defultData.bannarImg,
          jobTitle: defultData.jobTitle,
          userName: defultData.userName,
          userEmail: defultData.userEmail,
          minPrice: defultData.minPrice,
          maxPrice: defultData.maxPrice,
          postDate: defultData.postDate,
          jobCategory: defultData.jobCategory,
          applicantsNumber: defultData.applicantsNumber,
          applicationDeadline: defultData.applicationDeadline,
          jobDescription: defultData.jobDescription,
        },
      };

      const result = await jobCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });
    app.delete("/deletedata/:id", async (req, res) => {
      const id = req.params.id;

      const filter = { _id: new ObjectId(id) };
      const result = await jobCollection.deleteOne(filter);
      res.send(result);
    });

    app.get("/gets", async (req, res) => {
      const email = req.query.email;
      const filter = req.query.filter;
      let query = {
        userEmail: email,
      };

      if (filter) {
        query.jobCategorys = filter;
      }
      const result = await appliedCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/");

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
  res.send("your browser is now runnig sucessfully alhamudlillah");
});

app.listen(port, () => {
  console.log(`Your Surver is now running port on ${port}`);
});

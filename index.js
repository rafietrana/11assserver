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
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://my-assignment--11.web.app",
      "my-assignment--11.firebaseapp.com",
    ],
    credentials: true,
  })
);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = "mongodb+srv://my_ass_11:jGDuRnu3qvexXzHv@cluster0.hv89ofo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// custom middleWare
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  // console.log("token frome middleware", token);

  if (!token) {
    res.status(401).send("Unothorizw token");
  }
  jwt.verify(token, process.env.ACCES_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      res.status(401).send(" This is UnAutorize Token");
    }
    req.user = decoded;
    next();
  });
};

const cookeOption = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" ? true : false,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

async function run() {
  try {
    await client.connect();

    const jobCollection = client.db("jobDB").collection("jobs");
    const newJobCollection = client.db("jobDB").collection("newJob");
    const appliedCollection = client.db("jobDB").collection("applied");
    const blogCollection = client.db("BlogsDB").collection("newBlogs");
    const wishCollection = client.db("BlogsDB").collection("wish");

    //auth related api


    app.post("/jwt", (req, res) => {
      const user = req.body;
      // console.log("user value is ", req.body);

      const token = jwt.sign(user, process.env.ACCES_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.cookie("token", token, cookeOption).send({ sucess: true });
    });

    app.post("/logout", (req, res) => {
      console.log("logout backend is hitting now alhamdulillah");
      const user = req.body;
      console.log("clear method is now hited");

      res
        .clearCookie("token", { ...cookeOption, maxAge: 0 })
        .send({ sucess: true });
    });

    // services related auth

    // main area start
    app.get("/getJobCard", async (req, res) => {
      const result = await jobCollection.find().toArray();
      res.send(result);
    });

    // get new job

    app.get("/getNewJob", async(req, res)=>{
      const result = await newJobCollection.find().toArray();
      res.send(result)
    })

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
  try {
    const id = req.params.id;
 
    

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }

    const blog = await blogCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json(blog);


    
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
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
    // wish data
    app.post("/postwish", async (req, res) => {
      const wishData = req.body;
      const result = await wishCollection.insertOne(wishData);
      res.send(result);
    });
    app.get("/getwish", async (req, res) => {
      const result = await wishCollection.find().toArray();
      res.send(result);
    });

    // main area end

app.post("/jobpost", async (req, res) => {
  try {
    console.log("alhamdulillah jobpost hitting");

    const jobInfo = req.body;

    if (!jobInfo) {
      return res.status(400).send({ message: "No job data provided" });
    }

    const result = await jobCollection.insertOne(jobInfo);

    res.send(result);
  } catch (error) {
    console.error("Jobpost error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
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

    app.get("/getmyjob/:userEmail",  async (req, res) => {
      const userEmail = req.params.userEmail;
      const query = { createdBy: userEmail };
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
          tags: defultData.tags
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

    // await client.db("admin").command({ ping: 1 });
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

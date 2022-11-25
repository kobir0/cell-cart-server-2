const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
require("colors");

//Middleware
app.use(cors());
app.use(express.json());

//Mongo DB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.je7jmto.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
// Collection
const Brands = client.db("Cell-Cart").collection("Brands");
const Products = client.db("Cell-Cart").collection("Products");
const Users = client.db("Cell-Cart").collection("Users");
const Orders = client.db("Cell-Cart").collection("Orders");

//Server Run Function

async function run() {
  try {
    await client.connect();
    console.log("Database Conneted".cyan);
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      message: error,
    });
  }
}
run();

// Initial Server Load
app.get("/", (req, res) => {
  res.send(" Cell Cart Server is Running");
});

//Brand Category get

app.get("/brands", async (req, res) => {
  try {
    const brands = await Brands.find({}).toArray();
    res.send({
      status: true,
      brands: brands,
    });
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      message: error,
    });
  }
});

// Product GET POST DELETE PUT

app.post("/products", async (req, res) => {
  try {
    const products = req.body;

    const result = await Products.insertOne(products);

    if (result.insertedId) {
      res.send({
        status: true,
        message: "Product Added",
      });
    } else {
      res.send({
        status: false,
        message: "Failed to add the product",
      });
    }
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      message: error.message,
    });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const products = await Products.find({ brandId: id }).toArray();
    res.send({
      status: true,
      products: products,
    });
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      message: error,
    });
  }
});
app.get("/products", async (req, res) => {
  try {
    const email = req.query.email;

    const products = await Products.find({ email: email }).toArray();
    res.send({
      status: true,
      products: products,
    });
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      message: error,
    });
  }
});

app.get("/advertised", async (req, res) => {
  try {
    const products = await Products.find({
      reqField: { advertiseItem: true },
    }).toArray();
    res.send({
      status: true,
      products: products,
    });
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      message: error,
    });
  }
});

app.delete("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Products.deleteOne({ _id: ObjectId(id) });

    if (result.deletedCount) {
      res.send({
        status: true,
        message: "Deleted successfully !!",
      });
    } else {
      res.send({ status: false, message: "Somenthing Went Wrong ! Try Again" });
    }
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      message: error.message,
    });
  }
});
app.put("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const reqField = req.body;
    const query = { _id: ObjectId(id) };
    const upsert = { upsert: true };
    const updated = {
      $set: {
        reqField,
      },
    };

    const result = await Products.updateOne(query, updated, upsert);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      message: error.message,
    });
  }
});

// //App Listener
app.listen(port, () => {
  console.log("Server is conneted at port:", port);
});
module.exports = app;

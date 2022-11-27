const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
require("colors");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
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

///Stripe Post Request
app.post("/create-payment-intent", async (req, res) => {
  try {
    const booking = req.body;
    const price = booking.price;
    const amount = price * 100;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      message: error,
    });
  }
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
//Post Product
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

//Get products by id

app.get("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const products = await Products.find({
      brandId: id,
      status: "Available",
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

//Get products by email query

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

//Advetised Put

app.put("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const reqField = req.body;
    const query = { _id: ObjectId(id) };
    const upsert = { upsert: true };
    const updated = {
      $set: reqField,
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

//Get Adveried Items

app.get("/advertised", async (req, res) => {
  try {
    const products = await Products.find({
      advertiseItem: true,
      status: "Available",
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
app.get("/reported", async (req, res) => {
  try {
    const products = await Products.find({
      reported: true,
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

//orders Collection
app.post("/orders", async (req, res) => {
  try {
    const order = req?.body;

    const alreadyAdded = await Orders.findOne({
      email: order?.email,
      productId: order?.productId,
    });

    if (alreadyAdded) {
      return res.send({
        status: true,
        message: "Order already booked for you",
      });
    }
    const result = await Orders.insertOne(order);
    if (result.insertedId) {
      res.send({
        status: true,
        message: "Order Added Successfully",
      });
    } else {
      res.send({
        status: false,
        message: "Something went wrong !",
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

app.put("/orders/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const reqField = req.body;
    const query = { _id: ObjectId(id) };
    const upsert = { upsert: true };
    const updated = {
      $set: reqField,
    };

    const result = await Orders.updateOne(query, updated, upsert);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      message: error.message,
    });
  }
});

app.get("/orders", async (req, res) => {
  try {
    const email = req.query.email;

    const orders = await Orders.find({ email: email }).toArray();
    res.send({
      status: true,
      orders: orders,
    });
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      message: error,
    });
  }
});

app.get("/orders/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const order = await Orders.findOne({ _id: ObjectId(id) });
    res.send({
      status: true,
      order: order,
    });
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      message: error,
    });
  }
});

///Users Collection

app.post("/users", async (req, res) => {
  try {
    const user = req?.body;
    const email = user?.email;
    console.log(user, email);

    const alreadyUser = await Users.findOne({ email: email });
    console.log(alreadyUser);
    if (alreadyUser) {
      res.send({
        email: email,
        message: "User Already Exist to Db",
      });
      return;
    }

    const result = await Users.insertOne(user);

    if (result.insertedId) {
      res.send({
        status: true,
        email: email,
        message: "User Added",
      });
    } else {
      res.send({
        status: false,
        message: "Failed to add the User",
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

app.get("/users", async (req, res) => {
  try {
    const name = req.query.name;

    const users = await Users.find({ role: name }).toArray();
    res.send({
      status: true,
      users: users,
    });
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      message: error,
    });
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const user = await Users.findOne({ email: id });
    res.send({
      status: true,
      user: user,
    });
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      message: error,
    });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Users.deleteOne({ _id: ObjectId(id) });

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

app.put("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const reqField = req.body;
    const query = { _id: ObjectId(id) };
    const upsert = { upsert: true };
    const updated = {
      $set: reqField,
    };

    const result = await Users.updateOne(query, updated, upsert);
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

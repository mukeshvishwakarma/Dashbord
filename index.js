const express = require("express");
require("./db/config.js");
const cors = require("cors");
const User = require("./db/User.js");
const Product = require("./db/Product.js");
const Jwt = require("jsonwebtoken");
const jwtkey = "e-com";
const app = express();
app.use(cors());
app.use(express.json());
app.post("/signup", verifyToken, async (req, res) => {
  let user = new User(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result.password;
  console.log(result);
  Jwt.sign({ result }, jwtkey, { expiresIn: "2h" }, (error, token) => {
    if (error) {
      res.send({ result: "Something went wrong, Please try after some time" });
    }
    res.send({ result, auth: token });
  });
});

app.post("/login", async (req, res) => {
  console.log("req.body.password", req.body.password, req.body.email);
  if (req.body.password && req.body.email) {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
      Jwt.sign({ user }, jwtkey, { expiresIn: "2h" }, (error, token) => {
        if (error) {
          res.send({
            result: "Something went wrong, Please try after some time",
          });
        }
        res.send({ user, auth: token });
      });
    } else {
      res.send({ result: "No User Found" });
    }
  } else {
    res.send({ result: "No Result Found" });
  }
});

app.post("/add-product", verifyToken, async (req, res) => {
  let product = new Product(req.body);
  let result = await product.save();
  res.send(result);
});

app.get("/products", verifyToken, async (req, res) => {
  let products = await Product.find();
  if (products.length > 0) {
    res.send(products);
  } else {
    res.send("No Product Found");
  }
});
app.delete("/product/:id", verifyToken, async (req, res) => {
  const result = await Product.deleteOne({ _id: req.params.id });
  res.send(result);
});

app.get("/product/:id", verifyToken, async (req, res) => {
  let result = await Product.findOne({ _id: req.params.id });
  if (result) {
    res.send(result);
  } else {
    res.send("NO RESULT FOUND");
  }
});

app.put("/product/:id", verifyToken, async (req, res) => {
  let result = await Product.updateOne(
    { _id: req.params.id },
    {
      $set: req.body,
    }
  );
  if (result) {
    res.send(result);
  }
});
app.get("/search/:key", verifyToken, async (req, res) => {
  let result = await Product.find({
    $or: [
      { name: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
      { price: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
    ],
  });
  res.send(result);
});

function verifyToken(res, req, next) {
  let token = req.headers["Authorization"];
  console.log("authorization", token);
  if (token) {
    token = token.split(" ")[1];
    console.log("token", token);
    Jwt.verify(token, jwtkey, (err, valid) => {
      if (err) {
        res.status(401).send({ result: "Please provide valid token" });
      } else {
        next();
      }
    });
  } else {
    res.status(403).send({ result: "Please add token with header" });
  }
}

app.listen(5000);

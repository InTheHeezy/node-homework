const express = require("express");
const path = require("path");
const dogsRouter = require("./routes/dogs");
const { randomUUID } = require("crypto");

const app = express();

// Assignment 3b and 3c ask you to add middleware in this file.

app.use(express.json());

app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
})

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}]: ${req.method} ${req.path} (${req.requestId})`);
  next();
})

app.use("/", dogsRouter);// Do not remove this line

app.use("/images", express.static(path.join(__dirname, "public/images")));

app.use((req,res) => {
  res.status(404).json({
    error: "Route not found",
    requestId: "..."
  })
})

app.use((error, req, res, next) => {
  res.status(500).json({
    error: "Internal Server Error",
    requestId: "..."
  })
})

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Dog rescue app is listening on port 3000...");
  });
}

module.exports = app;


const express = require("express");
const path = require("path");
const dogsRouter = require("./routes/dogs");

const app = express();

// Assignment 3b and 3c ask you to add middleware in this file.

app.use(express.json());

app.use("/", dogsRouter);// Do not remove this line

app.use("/images", express.static(path.join(__dirname, "public/images")));

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Dog rescue app is listening on port 3000...");
  });
}

module.exports = app;


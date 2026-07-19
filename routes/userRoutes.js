const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

route.post("/register", userController.register);
route.post("/logon", userController.logon);
route.post("/logoff", userController.logoff);
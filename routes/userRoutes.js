const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();


/* @TODO 
Full routes for app.js

POST /api/users/register
POST /api/users/logon
POST /api/users/logoff

*/

route.post("/register", userController.register);
route.post("/logon", userController.logon);
route.post("logoff", userController.logoff);
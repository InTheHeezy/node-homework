const express = require("express");
const taskController = require("../controllers/taskController");

const router = express.Router();

router.post("/", taskController.create);
router.get("/", taskController.index);
router.get("/:id", taskController.show);
router.patch("/:id", taskController.update);
router.delete("/:id", taskController.deleteTask);

module.exports = router;
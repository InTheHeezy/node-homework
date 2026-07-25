const express = require("express");
const taskController = require("../controllers/taskController");

const router = express.Router();

router.post("/api/tasks", taskController.create);
router.get("/api/tasks", taskController.index);
router.get("/api/tasks/:id", taskController.show);
router.patch("/api/tasks/:id", taskController.update);
router.delete("/api/tasks/:id", taskController.deleteTask);

module.exports = router;
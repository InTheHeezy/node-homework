const express = require("express");
const analyticsController = require("../controllers/analyticsController");

const router = express.Router();

router.get("/:id", analyticsController.getUserAnalytics);
router.get("/", analyticsController.getUserWithStats);
router.get("/search", analyticsController.searchTasks);

module.exports = router;
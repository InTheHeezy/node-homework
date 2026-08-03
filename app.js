const express = require("express");
const userRouter = require("./routes/userRoutes");
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");
const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routes/taskRoutes");
const pool = require("./db/pg-pool");

const app = express();

global.user_id = null;
global.users = [];
global.tasks = [];

app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/tasks", authMiddleware, taskRouter);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

const handleShutdown = async () => {
  console.log("Shutting down server...");
  server.close(async () => {
    try {
      await pool.end();
      console.log("Database pool has ended.");
      process.exit(0);
    } catch (err) {
      console.error("Error closing database pool:", err);
      process.exit(1);
    }
  });
};

process.on("SIGINT", handleShutdown);
//process.on("SIGTERM", handleShutdown); this is for cloud platforms

module.exports = { app, server };
const express = require("express");
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");
const jwtMiddleware = require("./middleware/jwtMiddleware"); 
const userRouter = require("./routes/userRoutes");
const taskRouter = require("./routes/taskRoutes");
const analyticsRouter = require("./routes/analyticsRoutes");
const prisma = require("./db/prisma");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimiter = require("express-rate-limit");

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(xss());

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ message: `db not connected, error: ${ err.message }` });
  }
});

app.use("/api/users", jwtMiddleware, userRouter);
app.use("/api/tasks", jwtMiddleware, taskRouter);
app.use("/api/analytics", jwtMiddleware, analyticsRouter);

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
      await prisma.$disconnect();
      console.log("Prisma disconnected");
      process.exit(0);
    } catch (err) {
      console.error("Error closing database pool:", err);
      process.exit(1);
    }
  });
};

process.on("SIGINT", handleShutdown);

module.exports = { app, server };
require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; // point to the test database!
const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const { EventEmitter } = require('events');
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion.js")

const {
  index,
  show,
  create,
  update,
  deleteTask,
} = require("../controllers/taskController");

// a few useful globals
let user1 = null;
let user2 = null;
let saveRes = null;
let saveData = null;
let saveTaskId = null;

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
  user1 = await prisma.User.create({data: { name: "Bob", 
    email: "bob@sample.com", hashedPassword: "nonsense"}});
  user2 = await prisma.User.create({data: { name: "Alice", 
    email: "alice@sample.com", hashedPassword: "nonsense"}});
});

afterAll(() => {
  prisma.$disconnect();
})

describe("testing task creation", () => {
   it("14. cant create a task without a user id", async () => {
    const req = httpMocks.createRequest({
        method: "POST",
        body: { title: "first task" },
    });
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    try {
      await waitForRouteHandlerCompletion(create,req, saveRes);
    } catch (e) {
        expect(e.name).toBe("TypeError");
    }
  });

  it("15. You can't create a task with a bogus user id", async () => {
    const req = httpMocks.createRequest({
        user: { id: 999999999 },
        method: "POST",
        body: { title: "first task" },
    });
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    try {
      await waitForRouteHandlerCompletion(create,req, saveRes);
    } catch (e) {

        expect(e.name).toBe("PrismaClientKnownRequestError");
        expect(e.code).toBe("P2003");
    }
  });
})
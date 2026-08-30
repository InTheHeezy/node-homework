require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");
const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const { register, logoff, logon } = require("../controllers/userController");
const jwtMiddleware = require("../middleware/jwtMiddleware");
const jwt = require("jsonwebtoken");
const { EventEmitter } = require('events');

// a few useful globals
let saveRes = null;
let saveData = null;

const cookie = require("cookie");
function MockResponseWithCookies() {
  const res = httpMocks.createResponse({
    eventEmitter: EventEmitter,
  });
  res.cookie = (name, value, options = {}) => {
    const serialized = cookie.serialize(name, String(value), options);
    let currentHeader = res.getHeader("Set-Cookie");
    if (currentHeader === undefined) {
      currentHeader = [];
    }
    currentHeader.push(serialized);
    res.setHeader("Set-Cookie", currentHeader);
  };
  return res;
}

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
});

afterAll(() => {
  prisma.$disconnect();
});

let jwtCookie;

describe("testing logon, register, and logoff", () => {
  it("33. A user can be registered.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { name: "Bob", email: "bob@sample.com", password: "Pa$$word20" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(register, req, saveRes);
    expect(saveRes.statusCode).toBe(201); // success!
  });

  it("34. The user can logon.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { email: "bob@sample.com", password: "Pa$$word20" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(logon, req, saveRes);
    expect(saveRes.statusCode).toBe(200); // success!

    const setCookieArray = saveRes.get("Set-Cookie");
    //console.log("set cookie array?:", Array.isArray(setCookieArray));
    //console.log("Inside set cookie:", setCookieArray);
    if (setCookieArray && setCookieArray.length > 0) {
      jwtCookie = String(setCookieArray);
    }
    //console.log("big jwtCookie string:", jwtCookie);
  });

  it("35. A string in the cookie array starts with \"jwt=\"", () => {
    expect(jwtCookie).toBeDefined();
    expect(jwtCookie.startsWith("jwt=")).toBe(true);
  });

  it("36. That string contains \"HttpOnly;\"", () => {
    expect(jwtCookie).toBeDefined();
    expect(jwtCookie).toContain("HttpOnly;");
  });

   it("37. The returned data from the register has the expected name.", () => {
    
   });
});
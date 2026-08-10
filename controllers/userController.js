const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const prisma = require("../db/prisma");

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

async function register(req, res, next) {
    //if (!req.body) req.body = {};
    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: error.message });

    const { name, email, password } = value;

    const hashedPassword = await hashPassword(password);

    try {
        const user = await prisma.user.create({
            data: { 
                name, 
                email, 
                hashed_password : hashedPassword 
            },
            select: { 
                id: true,
                name: true,
                email: true 
            } //specify the column values to return
        });
        return res.status(201).json(user);
    } catch (e) {
        if (e.name === "PrismaClientKnownRequestError" && e.code === "P2002"){
           return res.status(400).json({ message: "An account with this email address already exists." }); 
        } else {
           return next(e); 
        }
    }
}

async function logon(req, res) {

    if (!req.body || !req.body.email || !req.body.password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    const { email, password } = req.body;

    const cleanEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({ 
        where: { 
            email : cleanEmail 
        }
    });

    if(!user) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const goodCredentials = await comparePassword(
        password,
        user.hashed_password,
    );

    if(!goodCredentials) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    global.user_id = Number(user.id);
    
    return res.status(200).json({
        name: user.name, 
        email: user.email 
    });
}

function logoff(req, res) {
    global.user_id = null;
    return res.sendStatus(200);
}

module.exports = {
  register, 
  logon,
  logoff
};

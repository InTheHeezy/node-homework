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
    
    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: error.message });

    const { name, email, password } = value;

    const hashedPassword = await hashPassword(password);

    try {
        const result = await prisma.$transaction(async (tx) => {

            const newUser = await tx.user.create({
                data: { 
                    name, 
                    email, 
                    hashed_password : hashedPassword 
                },
                select: { 
                    id: true,
                    name: true,
                    email: true 
                } 
            });

            const welcomeTaskData = [
                { title: "Complete your profile", user_id: newUser.id, priority: "medium" },
                { title: "Add your first task", user_id: newUser.id, priority: "high" },
                { title: "Explore the app", user_id: newUser.id, priority: "low" }
            ];

            await tx.task.createMany({ data: welcomeTaskData });

            const welcomeTasks = await tx.task.findMany({
                where: {
                    user_id: newUser.id,
                    title: { in: welcomeTaskData.map(t => t.title)}
                },
                select: {
                    id: true,
                    title: true,
                    is_completed: true,
                    user_id: true,
                    priority: true
                }
            });
            return { user: newUser, welcomeTasks };
        });

        res.status(201);
        res.json({
            user: result.user,
            welcomeTasks: result.welcomeTasks,
            transactionStatus: "success"
        });
        return;
    } catch (e) {
        if (e.code === "P2002"){
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
        }, 
        select: {
            id: true,
            name: true,
            email: true,
            hashed_password: true
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

    delete user.hashed_password;

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

async function show(req, res) {

    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await prisma.user.findUnique({
        where: { 
            id: userId 
        },
        select: {
            id: true,
            name: true,
            email: true,
            created_at: true,
            Task: {
                where: { 
                    isCompleted: false 
                },
                select: { 
                    id: true, 
                    title: true, 
                    priority: true,
                    created_at: true 
                },
                orderBy: { 
                    created_at: 'desc' 
                },
                take: 5
            }
        }
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user);
}

module.exports = {
  register, 
  logon,
  logoff,
  show
};

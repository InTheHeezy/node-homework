const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const pool = require("./db/pg-pool");

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

async function register(req, res) {

    if (!req.body) req.body = {};
    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: error.message });

    const { name, email, password } = value;

    value.hashed_password = await hashPassword(password);

    let newUser = null;
    try {
        newUser = await pool.query(
            `INSERT INTO users (email, name, hashedPassowrd) 
            VALUES ($1, $2, $3)
            RETURNING id, email, name`,
            [value.email, value.name. value.hashed_Password]
        );
    } catch (e) {
        if (e.code === "23505") return res.status(400).json({ message: "Unique constraint for email was violated" });
        return next(e);
    }

    // global.users.push(newUser);
    // global.user_id = newUser;

    return res.status(201).json({
        name: newUser.name, 
        email: newUser.email 
    });
}

async function logon(req, res) {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    const user = result.rows[0];

    if(!user) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const goodCredentials = await comparePassword(
        password,
        user.hashedPassword,
    );

    if(!goodCredentials) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    global.user_id = user;
    
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

const { userSchema } = require("../validation/userSchema");

function register(req, res) {

    if (!req.body) req.body = {};
    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: error.message });

    const { name, email, password } = req.body;

    const id = Date.now().toString();

    const newUser = {
        id,
        name,
        email,
        password
    };

    global.users.push(newUser);
    global.user_id = newUser;

    return res.status(201).json({
        name: newUser.name, 
        email: newUser.email 
    });
}

function logon(req, res) {
    const { email, password } = req.body;

    const validUser = global.users.find(user => 
        user.email === email && user.password === password
    );

    if (!validUser) {
        return res.status(401).json({});
    } 

    global.user_id = validUser;
    
    return res.status(200).json({
        name: validUser.name, 
        email: validUser.email 
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

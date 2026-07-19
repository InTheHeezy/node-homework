global.users = global.users || [];
global.userid = global.userid || null;

function register(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Missing account information"});
        }

        const newUser = {
            name,
            email,
            password
        }

        global.users.push(newUser)
        global.userid = newUser;

        return res.status(201).json({
            message: "User registered successfully",
            user: { name: newUser.name, email: newUser.email }
        });

    } catch(error) {
        return res.status(500).json({ error: "Server error" })
    }
}

module.exports = {
  register, 
  logon,
  logoff
};
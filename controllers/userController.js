global.users = global.users || [];
global.user_id = global.user_id || null;

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
        global.user_id = newUser;

        return res.status(201).json({
            message: "User registered successfully",
            user: { name: newUser.name, email: newUser.email }
        });

    } catch(error) {
        return res.status(500).json({ error: "Server error" })
    }
}

function logon(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Missing account information"});
        }

        const validUser = global.users.find(user => 
            user.email === email && user.password === password
        );

        if (!validUser) {
            return res.status(401).json({ error: "Combination of email and password not found"})
        } 

        global.user_id = validUser;
            
        return res.status(200).json({
            message: "User logged on successfully",
            user: { name: validUser.name, email: validUser.email }
        });

    } catch(error) {
        return res.status(500).json({ error: "Server error" })
    }
}

function logoff(req, res) {
    try {
        global.user_id = null;
        res.status(200).json({
            message: "User logged off successfully"
        })
    } catch(error) {
        return res.status(500).json({ error: "Server error" })
    }
}

module.exports = {
  register, 
  logon,
  logoff
};
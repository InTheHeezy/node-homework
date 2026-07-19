module.exports = function(req, res, next) {
    try {
        return res.status(404).json({
            error: "Not found",
            message: `Could not find the path for ${req.path}`
        })
    } catch (error) {
        return res.status(500).json({ error: "Server error"});
    }
};
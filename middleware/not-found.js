module.exports = function(req, res, next) {
    return res.status(404).json({
        error: "Not found",
            essage: `Could not find the path for ${req.path}`
    })
};
module.exports = function(err, req, res, next) {
   return res.status(500).json({
    error: "Server Error",
    message: err.message || "The server has encountered an unexpected error"
   });
}
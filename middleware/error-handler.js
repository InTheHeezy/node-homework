const errorHandler = (err, req, res, next) => {
   return res.status(500).json({
      error: "Server error"
   });
}

module.exports = errorHandler;
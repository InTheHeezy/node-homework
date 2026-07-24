const errorHandler = (err, req, res, next) => {
   return res.status(500).json({
      error: "Unexpected server error"
   });
}

module.exports = errorHandler;
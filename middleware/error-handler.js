module.exports = function(err, req, res, next) {
   return res.status(500).json({
      message: "Unexpected server error"
   });
}
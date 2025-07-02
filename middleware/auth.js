const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // JWT auth logic here
  next();
}; 
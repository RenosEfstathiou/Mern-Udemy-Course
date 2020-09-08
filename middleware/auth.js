const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  // get token from the header
  const token = req.header('x-auth-token');

  // check if we got a token
  if (!token) {
    res.status(401).json({ msg: 'No token. Autherization denied' });
  }

  // autherize Token
  try {
    const decoded = jwt.verify(token, config.get('jwtSecret'));
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

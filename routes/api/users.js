const express = require('express');
const router = express.Router();

/**
 * @route  Post api/users
 * @desc   Create a user
 * @access PUBLIC
 */
router.post('/', (req, res) => {
  res.send('User route');
});

module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');
// things required for the validation
const { check, validationResult } = require('express-validator');
const User = require('../../models/Users');
// @route       GET api/auth
// @desc        Test route
// @access      Public

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

// @route       POST api/auth
// @desc        Authenticate User & get Token
// @access      Public

router.post(
  '/',
  [
    // check if our request body is valid and if its not then we get in validationResult a request body that holds an array of error objects ex [{errors  : [ { value: " ", msg: "Name is required"}]}]
    check('email', 'Please include a valid Email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    // we parse the validation errors to a const and check if there were any and if there were we send a response showing those errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // deconstructing req.body so that we dont have to get inside req all the time
    const { email, password } = req.body;

    try {
      // check if user exists nad send error if exists
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({
          errors: [
            {
              msg: 'Invalid credentials'
            }
          ]
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({
          errors: [
            {
              msg: 'Invalid credentials'
            }
          ]
        });
      }
      // return the jsonwebtoken
      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (error) {
      console.log(error);
      res.status(500).send('Server Error');
    }
  }
);
module.exports = router;

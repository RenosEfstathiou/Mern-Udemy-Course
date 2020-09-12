const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
// things required for the validation
const { check, validationResult } = require('express-validator');

// import the user Model - mongoose Schema
const User = require('../../models/User');
// @route       GET api/users
// @desc        Register User
// @access      Public

router.post(
  '/',
  [
    // check if our request body is valid and if its not then we get in validationResult a request body that holds an array of error objects ex [{errors  : [ { value: " ", msg: "Name is required"}]}]
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid Email').isEmail(),
    check(
      'password',
      'please enter a password with 6 or more characters'
    ).isLength({ min: 6 })
  ],
  async (req, res) => {
    // we parse the validation errors to a const and check if there were any and if there were we send a response showing those errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // deconstructing req.body so that we dont have to get inside req all the time
    const { name, email, password } = req.body;

    try {
      // check if user exists nad send error if exists
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({
          errors: [
            {
              msg: 'User already exists'
            }
          ]
        });
      }
      // get users gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      });
      // create the User instance
      user = new User({ name, email, avatar, password });
      // encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
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

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

// Models
const User = require('../../models/User');

/**
 * @route  Post api/users
 * @desc   Create a user
 * @access PUBLIC
 */
router.post(
  '/',
  [
    check('name', 'Name is required').trim().not().isEmpty(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
    check('email', 'Please enter a valid email address')
      .normalizeEmail()
      .isEmail(),
    check(
      'confirm_password',
      'Please enter a password confirmation with 6 or more characters'
    )
      .isLength({ min: 6 })
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          // trow error if passwords do not match
          throw new Error("Passwords don't match");
        } else {
          return value;
        }
      })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // See if user exists
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      // create new user instance
      user = new User({
        name,
        email,
        password
      });

      // Encrypt pwd
      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

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
          if (err) {
            throw err;
          }

          return res.json({ token });
        }
      );
    } catch (err) {
      console.log(err.message);
      return res.status(500).send('Server Error');
    }
  }
);

module.exports = router;

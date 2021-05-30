const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

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
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    res.status('201').send(req.body);
  }
);

module.exports = router;

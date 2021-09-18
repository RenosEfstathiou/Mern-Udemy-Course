const express = require('express');
const { check, validationResult } = require('express-validator');

const router = express.Router();

const auth = require('../../middleware/auth');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

/**
 * @route  GET api/profiles/me
 * @desc   Get/Fetch current logged in user's profile
 * @access PRIVATE
 */
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      'user',
      ['name']
    );

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(profile);
  } catch (err) {
    console.log(err.message);

    res.status(500).send('Server error');
  }
});

/**
 * @route  POST api/profiles/me
 * @desc   POST Create or Update current logged in user's profile
 * @access PRIVATE
 */
router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skills is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      status,
      bio,
      githubusername,
      skills,
      youtube,
      twitter,
      facebook,
      linkedin,
      instagram
    } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;

    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (status) profileFields.status = status;
    if (bio) profileFields.bio = bio;
    if (githubusername) profileFields.githubusername = githubusername;

    if (skills) {
      profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    // Build social profile data
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        // *Update profile if profile already exists

        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      // *Create new profile

      profile = new Profile(profileFields);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);

      return res.status(500).send('Server Error');
    }
  }
);

module.exports = router;

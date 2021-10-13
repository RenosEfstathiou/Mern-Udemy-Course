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
 * @route  GET api/profiles
 * @desc   Get/Fetch all profiles
 * @access PRIVATE
 */
router.get('/', auth, async (req, res) => {
  try {
    const profiles = await Profile.find({
      user: { $ne: req.user.id }
    }).populate('user', ['name']);

    if (!profiles) {
      return res.status(400).json({ msg: 'There are no profiles available' });
    }

    res.json(profiles);
  } catch (err) {
    console.log(err.message);

    res.status(500).send('Server error');
  }
});

/**
 * @route  GET api/profiles/users/:user_id
 * @desc   Get/Fetch a user's profile by User Id
 * @access PRIVATE
 */
router.get('/users/:user_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate('user', ['name']);

    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found' });
    }

    res.json(profile);
  } catch (err) {
    console.log(err.message);

    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }

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
        //*Update profile if profile already exists

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

/**
 * @route  PUT api/profiles/experience
 * @desc   Add profile experience
 * @access Private
 */
router.put(
  '/experiences',
  [
    auth,
    [
      check('title', 'Title is required!').not().isEmpty(),
      check('company', 'Company name is required!').not().isEmpty(),
      check('from', 'Please enter a valid from date!')
        .not()
        .isEmpty()
        .isISO8601('YYYY-MM-DD')
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, company, location, from, to, current, description } =
      req.body;

    const newExperience = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      if (!profile) {
        res.status(400).json({
          msg: "There was an error proccesing you accont's data please try again later!"
        });
      }

      profile.experiences.unshift(newExperience);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);

      return res.status(500).send('Server Error');
    }
  }
);

/**
 * @route  Delete api/profiles/
 * @desc   Delete the current logged in user's data.
 * @access PRIVATE
 */
router.delete('/', auth, async (req, res) => {
  try {
    // Remove user's profile
    await Profile.findOneAndRemove({ user: req.user_id });

    // Remove user
    await User.findOneAndRemove({ _id: req.user_id });

    //TODO Remove user's posts

    //TODO Remove user's likes

    //TODO Remove user's comments

    res.json({ msg: 'User removed successfully removed!' });
  } catch (err) {
    console.error(err.message);

    return res.status(500).send('Server Error');
  }
});

/**
 * @route  Delete api/profiles/experiences/:exp_id
 * @desc   Delete experience from profile
 * @access PRIVATE
 */
router.delete('/experiences/:exp_id', auth, async (req, res) => {
  try {
    let removeIndex = [];
    let profile = await Profile.findOne({ user: req.user.id });

    if (profile && !profile.experiences.isEmpty) {
      removeIndex = profile.experiences
        .map(experience => experience.id)
        .indexOf(req.params.exp_id);
    }

    if (!removeIndex.isEmpty) {
      profile.experiences.splice(removeIndex, 1);

      await profile.save();
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);

    return res.status(500).send('Server Error');
  }
});

module.exports = router;

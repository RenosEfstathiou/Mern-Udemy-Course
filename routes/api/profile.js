const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
// we add the Profile model
const Profile = require('../../models/Profile');
const User = require('../../models/Users');

// we use auth to protect our  route so only if we are logged in we can get our profile (Token)

router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res
        .status(400)
        .json({ msg: 'There is no a profile for this user' });
    }

    res.json(profile);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
});

// @route      POST api/profile/
// @desc        Create or update a user's profile
// @access      Private since we need authentication
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
      res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      status,
      skills,
      bio,
      githubusername,
      youtube,
      facebook,
      twitter,
      linkedin,
      instagram
    } = req.body;

    // build profile Object
    const profileFields = {};

    // then we get our user from req.user.id (Token)
    profileFields.user = req.user.id;

    // then we check if the something changed  and exists and set it to our profileFields object
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (status) profileFields.status = status;
    if (bio) profileFields.bio = bio;
    if (githubusername) profileFields.githubusername = githubusername;

    // here we check if there are any skills
    //  because the skills as we pass them are separated with commas  we use skills.split(',') to split the req.skills to an array of strings for ex
    // if we pass "PHP , HTML ,SASS, BOOTSTRAP" => we will get an the following array ["PHP ","HTML","SASS"...]
    // Then we use .map() to get each one element of the array and we trim it so there are not any black spaces
    if (skills) {
      profileFields.skills = skills.split(',').map(skill => skill.trim());
      console.log(profileFields.skills);
    }

    //  Build-initialize a social object
    //  We have to initialize it because otherwise we will get an error  that it cant find social field
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      // if the profile exists we want to update  its information
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }
      // if it doesn exist then we will create it
      // Creation
      profile = new Profile(profileFields);

      await profile.save();
      res.json(profile);
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;

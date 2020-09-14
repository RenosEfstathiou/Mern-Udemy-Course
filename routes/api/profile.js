const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const config = require('config');
const request = require('request');
// we add the Profile model
const Profile = require('../../models/Profile');
const User = require('../../models/User');

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

// @route       GET api/profile/
// @desc        GET all profiles in the db
// @access      Public

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
});

// @route       GET api/profile/user/:user_id
// @desc        GET users profile using his id
// @access      Public

router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate('user', ['name', 'avatar']);
    if (!profile)
      return res
        .status(400)
        .json({ msg: 'There is not a profile for this user ' });
    res.json(profile);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
});

// @route       Delete api/profile/
// @desc        Create or update a user's profile
// @access      Private since we need authentication

router.delete('/', auth, async (req, res) => {
  try {
    // @todo - remove user's posts
    // remove profile
    await Profile.findOneAndRemove({ user: req.user.id });

    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'User has been deleted' });
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

// @route       PUT api/profile/experience
// @desc        Add profile experience
// @access      Private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) res.status(400).json({ errors: errors.array() });

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      descreption
    } = req.body;

    const newExperience = {
      title,
      company,
      location,
      from,
      to,
      current,
      descreption
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExperience);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.log(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    Delete api/profile/epxerience/:exp_id
// @desc     Delete experience from profile
// @access   Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    // get remove index
    const removeIndex = profile.experience
      .map(ex => ex.id)
      .indexOf(req.params.exp_id);

    if (!(removeIndex >= 0)) res.json({ msg: 'Exprerience doesnt exist' });
    else {
      profile.experience.splice(removeIndex, 1);
      await profile.save();
      res.json(profile);
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

// @route       PUT api/profile/education
// @desc        Add profile education
// @access      Private
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'Degree is required').not().isEmpty(),
      check('fieldofstudy', 'Field of Study is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) res.status(400).json({ errors: errors.array() });

    const { school, degree, fieldofstudy, from, to, descreption } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      descreption
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.log(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    Delete api/profile/education/:edu_id
// @desc     Delete experience from profile
// @access   Private

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    // get remove index
    const removeIndex = profile.education
      .map(ed => ed.id)
      .indexOf(req.params.exp_id);
    if (!(removeIndex >= 0)) res.json({ msg: 'The education does not exist' });
    else {
      profile.education.splice(removeIndex, 1);
      await profile.save();
      res.json(profile);
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/profile/github/:username
// @desc     Get users repos from github
// @access   Public

router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'gitClientId'
      )}&client_secret=${config.get('gitSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' }
    };
    request(options, (error, response, body) => {
      if (error) console.log(error);
      if (response.statusCode !== 200) {
        res.status(400).json({ msg: 'No Github profile found' });
      }
      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

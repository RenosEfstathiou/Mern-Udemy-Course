const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');

// @route       POST api/posts
// @desc        Create a post
// @access      Private

router.post(
  '/',
  [auth, check('text', 'Text is required').not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        user: user.id,
        name: user.name,
        avatar: user.avatar,
        text: req.body.text
      });

      const post = await newPost.save();
      res.json(post);
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route       GET api/posts
// @desc        Get all posts
// @access      Private

router.get('/', auth, async (req, res) => {
  try {
    const post = await Post.find().sort({ date: -1 });
    res.json(post);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

// @route       GET api/posts/:id
// @desc        Get post by id
// @access      Private

router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) res.status(404).json({ msg: 'This post is not available' });
    res.json(post);
  } catch (err) {
    console.log(err.message);
    if (err.kind === 'ObjectId')
      res.status(400).json({ msg: 'This post is not available' });
    res.status(500).send('Server Error');
  }
});

// @route       GET api/posts/:id
// @desc        Get post by id
// @access      Private

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    // check on the user
    if (post.user.toString() !== req.user.id) {
      res.status(401).json({ msg: 'User not authorized' });
    }
    if (!post) res.status(400).json({ msg: 'This post was not found' });
    await post.remove();
    res.json({ msg: 'Post removed successfully' });
  } catch (err) {
    console.log(err.message);
    if (err.kind === 'ObjectId')
      res.status(400).json({ msg: 'This post is not available' });
    res.status(500).send('Server Error');
  }
});

// @route       PUT api/posts/like/:id
// @desc        Add a like to a post
// @access      Private

router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) res.status(404).json({ msg: 'This post is not available' });
    if (
      post.like.filter(lik => lik.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
    }
    post.like.unshift({ user: req.user.id });
    await post.save();
    res.json(post.like);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

// @route       PUT api/posts/unlike/:id
// @desc        Add a like to a post
// @access      Private

router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) res.status(404).json({ msg: 'This post is not available' });
    if (
      post.like.filter(like => like.user.toString() === req.user.id).length == 0
    ) {
      return res.status(400).json({ msg: 'Like already unliked' });
    }
    // get remover index
    const removeIndex = post.like
      .map(lik => lik.user.toString())
      .indexOf(req.user.id);
    if (!(removeIndex >= 0)) {
      return res.status(401).json({ msg: 'An Error Occured' });
    } else {
      post.like.splice(removeIndex, 1);
      await post.save();
      res.json(post.like);
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

// @route       PUT api/posts/comment/:id
// @desc        Add a comment to a post
// @access      Private

router.put(
  '/comment/:id',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) res.status(400).json({ errors: errors.array() });
    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);
      const newComment = {
        text: req.body.text,
        user: user.id,
        name: user.name,
        avatar: user.avatar
      };
      post.comments.unshift(newComment);
      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.log(err.message);
      res.status(500).server('Server Error');
    }
  }
);

// @route       DELETE api/posts/comment/:id/:comment_id
// @desc        Delete a comment from a post using id
// @access      Private

router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    // pull out comment
    const comment = post.comments.find(
      com => com.id.toString() === req.params.comment_id
    );
    if (!comment) {
      return res.status(404).json({ msg: 'Comment does not exist' });
    }
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not autherized' });
    }

    const removeIndex = post.comments
      .map(com => com.user.toString())
      .indexOf(req.user.id);
    if (!(removeIndex >= 0)) {
      return res.status(404).json({ msg: 'Comment was not found' });
    } else {
      post.comments.splice(removeIndex, 1);
      await post.save();
      res.json(post.comments);
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).server('Server Error');
  }
});

module.exports = router;

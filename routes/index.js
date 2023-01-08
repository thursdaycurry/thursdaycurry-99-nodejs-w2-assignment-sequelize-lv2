const express = require('express');
const router = express.Router();

const postsRouter = require('./posts');
const commentsRouter = require('./comments');
const signupRouter = require('./signup');
const loginRouter = require('./login');
const likesRouter = require('./likes');

router.use('/api', postsRouter);
router.use('/api', commentsRouter);
router.use('/api', signupRouter);
router.use('/api', loginRouter);
router.use('/api', likesRouter);

module.exports = router;

const express = require("express");
const router = express.Router();

const postsRouter = require("./posts");
const commentsRouter = require("./comments");
const signupRouter = require("./signup");
const loginRouter = require("./login");

router.use("/api", postsRouter);
router.use("/api", commentsRouter);
router.use("/api", signupRouter);
router.use("/api", loginRouter);

module.exports = router;
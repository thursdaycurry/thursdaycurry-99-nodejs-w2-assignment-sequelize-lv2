const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    content: {
      type: String,
    },
    postId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comments-alpha", commentSchema);

// const mongoose = require("mongoose");

// const commentSchema = new mongoose.Schema(
//   {
//     user: {
//       type: String,
//       required: true,
//     },
//     password: {
//       type: String,
//       required: true,
//     },
//     content: {
//       type: String,
//     },
//     postId: {
//       type: String,
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Comments", commentSchema);

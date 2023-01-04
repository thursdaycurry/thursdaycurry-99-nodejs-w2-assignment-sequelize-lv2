const mongoose = require("mongoose");

// schema 정의
const postsSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
    },
  },
  { timestamps: true } // create timestamp automatically (createAt, updateAt)
);

// collection이름이 Posts로 된다
module.exports = mongoose.model("Posts", postsSchema);

const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  comment: {
    type: String,
    required: true,
  },
  timing: {
    type: Date,
    default: Date.now,
  },
  randomId: {
    type: String,
    default: () => `#${Math.floor(Math.random() * 1000000)}`,
  },
  likes: {
    type: Number,
    default: 0,
  },
  userId: {
    type: String,
    required: true,
  },
  subscribeMember: {
    type: Boolean,
    default: false,
  },
});

const CommentModel = mongoose.model("post_comments", CommentSchema);

module.exports = CommentModel;

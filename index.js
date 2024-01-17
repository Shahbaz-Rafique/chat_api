const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const Comments = require("./models/CommentSchema");
const FormDataModel = require("./models/FormSchema");

require("./config/config");

app.use(express.json());
app.use(cors());

app.post("/post-comments", async (req, res) => {
  const { comment, userId } = req.body;

  try {
    // Check if the user has already commented
    const existingComment = await Comments.findOne({ userId });

    if (existingComment) {
      // User has already commented once

      // Check if subscribeMember is true for the user
      const isSubscribeMember = existingComment.subscribeMember || false;

      if (!isSubscribeMember) {
        return res.status(403).json({
          status: "Failed",
          message: "You can only comment once.",
        });
      }
      // User is a subscribe member, allow commenting again
    }

    const newComment = new Comments({
      comment,
      userId,
      subscribeMember: true, // Set subscribeMember to false for new comments
    });

    // Save the comment
    await newComment.save();

    // ... rest of your code

    res.status(200).json({
      status: "Success",
      message: "Comment posted successfully!",
    });
  } catch (err) {
    // Handle errors
    console.error(err);
    res.status(500).json({
      status: "Failed",
      message: "Error posting comment.",
    });
  }
});

app.get("/get-comments", async (req, res) => {
  try {
    // Fetch all comments
    const comments = await Comments.find({});

    // Respond with additional details (timing, randomId, likes, and dislikes)
    const formattedComments = comments.map((comment) => ({
      _id: comment._id, // Extract MongoDB generated ID
      comment: comment.comment,
      timing: comment.timing,
      randomId: comment.randomId,
      likes: comment.likes,
    }));

    res.status(200).json({
      status: "Success",
      data: {
        comments: formattedComments,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "Failed",
      message: err.message,
    });
  }
});

app.get("/get-post/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;

    // Find the post by ID using Comments (your CommentSchema model)
    const post = await Comments.findById(postId);

    if (!post) {
      return res.status(404).json({
        status: "Failed",
        message: "Post not found",
      });
    }

    // Respond with post details
    const formattedPost = {
      _id: post._id,
      comment: post.comment,
      timing: post.timing,
      randomId: post.randomId,
      likes: post.likes,
    };

    res.status(200).json({
      status: "Success",
      data: {
        post: formattedPost,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "Failed",
      message: err.message,
    });
  }
});
app.post("/like-comment/:id", async (req, res) => {
  try {
    const commentId = req.params.id;

    // Find the comment by ID
    const comment = await Comments.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        status: "Failed",
        message: "Comment not found",
      });
    }

    // Increment the likes count
    comment.likes += 1;

    // Save the updated comment
    await comment.save();

    res.status(200).json({
      status: "Success",
      data: {
        likes: comment.likes,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "Failed",
      message: err.message,
    });
  }
});
app.post("/like-dislike-comment/:id", async (req, res) => {
  try {
    const commentId = req.params.id;

    // Find the comment by ID
    const comment = await Comments.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        status: "Failed",
        message: "Comment not found",
      });
    }

    // Check if the comment is already liked by the user
    const isAlreadyLiked = req.body.isLiked;

    // Update the likes count based on whether the comment is already liked or not
    if (isAlreadyLiked) {
      comment.likes -= 1; // Decrease the likes count
    } else {
      comment.likes += 1; // Increase the likes count
    }

    // Save the updated comment
    await comment.save();

    res.status(200).json({
      status: "Success",
      data: {
        likes: comment.likes,
      },
    });
  } catch (err) {
    console.error("Error in like-dislike-comment route:", err);
    res.status(500).json({
      status: "Failed",
      message: err.message,
    });
  }
});

const stripe = require("stripe")(
  "sk_test_51OUaDoDbgAttP20kgQqyys4qw1VQktLWGhnubgpvY9W6wEJ6elXI9fBheKx0BKzvDN734PB0H3wLX4lA3g8VzStK00N0HwFU9E"
);

app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "USD",
            product_data: {
              name: "Information",
            },
            unit_amount: 1.99 * 100,
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });

    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
const generateRandomId = () =>
  `#${Math.floor(100000 + Math.random() * 900000)}`;

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Generate a random ID in the format '#423423'
    const randomId = generateRandomId();

    const newUser = new FormDataModel({ name, email, password, randomId });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Login endpoint
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email and password
    const user = await FormDataModel.findOne({ email, password });

    if (user) {
      // Successful login
      res.status(200).json({ message: "Login successful" });
    } else {
      // Invalid credentials
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post("/allow-comments", async (req, res) => {
  const { comment, userId } = req.body;

  try {
  const newComment = new Comments({
      comment,
      userId,
      subscribeMember: true, // Set subscribeMember to true for new comments without checks
    });

    // Save the comment
    await newComment.save();

    // ... rest of your code

    res.status(200).json({
      status: "Success",
      message: "Comment posted successfully!",
    });
  } catch (err) {
    // Handle errors
    console.error(err);
    res.status(500).json({
      status: "Failed",
      message: "Error posting comment.",
    });
  }
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});

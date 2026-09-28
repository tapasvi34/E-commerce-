const mongoose = require("mongoose");

const learningSchema = new mongoose.Schema({
  //LINK: This connects the path to a specific User ID
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [String],
  result: String, // This stores the AI's roadmap text
  title: { type: String, default: "My AI Roadmap" }, 
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("LearningPath", learningSchema);
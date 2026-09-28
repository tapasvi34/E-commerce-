const mongoose = require("mongoose");
//define to mongodb what fields a user has 
const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    default: "PLAYER_ONE" 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  // GAME STATS BELOW--
  rank: { 
    type: String, 
    default: "NOOB CODER" 
  },
  level: { 
    type: Number, 
    default: 1 
  },
  xp: { 
    type: Number, 
    default: 0 
  },
  // SAVED PROGRESS--
  savedPaths: [{
    title: String,
    goal: String,
    phases: Array,
    createdAt: { type: Date, default: Date.now }
  }],
  purchasedCourses: [{
    title: String,
    platform: String,
    progress: { type: String, default: "0%" },
    purchasedAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model("User", userSchema);
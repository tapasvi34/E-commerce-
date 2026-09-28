const mongoose = require("mongoose"); //import mongo library 

const connectDB = async () => {
  try {
    // It looks for the URI in .env, or defaults to local Mongo
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/codingLadder");
    //connect to db on my computer?
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Error: ${error.message}`);
    process.exit(1); // Stop server if the db fails, dont run broken react app
  }
};

module.exports = connectDB;
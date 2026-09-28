const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function runTest() {
  const key = process.env.GEMINI_API_KEY;
  
  if (!key) {
    console.error("❌ ERROR: No API key found in .env file!");
    return;
  }

  console.log("Checking key:", key.substring(0, 5) + "..."); 

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Say 'System OK' if you can hear me.");
    
    console.log("✅ SUCCESS!");
    console.log("Gemini Response:", result.response.text());
  } catch (error) {
    console.error("❌ API CALL FAILED!");
    console.error("Message:", error.message);
  }
}

runTest();
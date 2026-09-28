const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 1. INITIAL CONFIG
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// 2. IMPORT CUSTOM MODULES
const connectDB = require('./config/db');
const User = require('./models/user'); // Ensure filename is 'user.js' or 'User.js'
const LearningPath = require('./models/LearningPath');

// 3. CONNECT TO DATABASE
connectDB();

// 4. MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 5. AI CONFIGURATION
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 6. ROUTES: AUTHENTICATION (Integrated from authRoutes)
app.use("/api/auth", require("./routes/authRoutes"));

// 7. ROUTES: PROFILE & GAME STATS
app.get('/api/profile/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching profile" });
    }
});

// ... (Keep existing imports and middleware)

// 8. ROUTES: AI LEARNING PATH GENERATION 
app.post("/generate-path", async (req, res) => {
    try {
        const { answers, questions } = req.body;
        
        // Split data for the AI to understand context
        const skillsData = answers.slice(0, 10).map((ans, i) => `${questions[i]}: ${ans}/10`).join(", ");
        const interestsData = answers.slice(10, 20).map((ans, i) => `${questions[i+10]}: ${ans}`).join(", ");

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

        const prompt = `
        You are an elite coding mentor. I have gathered data from a user via a 20-question quiz.
        
        USER SKILL LEVELS (1-10 scale):
        ${skillsData}
        
        USER INTERESTS AND GOALS:
        ${interestsData}
        
        Based on this, create a highly personalized 8-bit themed learning roadmap. 
        1. Identify their "Current Class" based on skill levels.
        2. Create 5 clear "Quests" (Phases) to reach their goal.
        3. Suggest specific projects and resources. Also suggest one of three courses- Python, Web Development or Machine Learning
        Use clear Markdown formatting with headers and bullet points.
        `;

        const result = await model.generateContent(prompt);
        res.json({ result: result.response.text() });
    } catch (error) {
        console.error("AI Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ... (Keep the rest of your server.js as is)

// 9. ROUTES: SAVE PATH & AWARD XP
app.post("/api/save-path/:userId", async (req, res) => {
    try {
        const { title, fullPath } = req.body;
        const user = await User.findById(req.params.userId);
        
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Save to User's embedded array
        user.savedPaths.push({
            title: title || "My Coding Journey",
            goal: title,
            phases: [fullPath] 
        });

        // Award XP + Level Up Logic
        user.xp += 50; 
        if (user.xp >= 1000) {
            user.level += 1;
            user.xp = 0; 
            user.rank = user.level >= 5 ? "ELITE CODER" : "PRO CODER";
        }

        await user.save();

        // Also save to separate LearningPath collection for backup/scaling
        const newPath = new LearningPath({
            userId: user._id,
            title: title,
            result: fullPath
        });
        await newPath.save();

        res.json({ success: true, message: "Path saved and XP awarded!", newXp: user.xp });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 10. ROUTES: CASHFREE PAYMENT SYSTEM
app.post('/create-order', async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        const orderId = "order_" + Date.now();

        const response = await axios.post(
            "https://sandbox.cashfree.com/pg/orders",
            {
                order_id: orderId,
                order_amount: 500,
                order_currency: "INR",
                customer_details: {
                    customer_id: phone || "9999999999",
                    customer_name: name || "Test User",
                    customer_email: email || "test@test.com",
                    customer_phone: phone || "9999999999"
                },
                order_meta: {
                    return_url: `http://localhost:${PORT}/payment-status?order_id=${orderId}`
                }
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-client-id": process.env.CASHFREE_APP_ID,
                    "x-client-secret": process.env.CASHFREE_SECRET_KEY,
                    "x-api-version": "2022-09-01"
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Order creation failed." });
    }
});

app.get('/payment-status', async (req, res) => {
    try {
        const { order_id } = req.query;
        const response = await axios.get(
            `https://sandbox.cashfree.com/pg/orders/${order_id}`,
            {
                headers: {
                    "x-client-id": process.env.CASHFREE_APP_ID,
                    "x-client-secret": process.env.CASHFREE_SECRET_KEY,
                    "x-api-version": "2022-09-01"
                }
            }
        );

        const order = response.data;
        if (order.order_status === "PAID") {
            // Success Page
            res.send(`
                <div style="font-family:sans-serif; text-align:center; padding:50px;">
                    <h1 style="color:green;">✅ PAYMENT SUCCESSFUL</h1>
                    <p>Order ID: ${order.order_id}</p>
                    <a href="/dashboard.html" style="padding:10px 20px; background:blue; color:white; text-decoration:none;">Go to Dashboard</a>
                </div>
            `);
        } else {
            res.send(`<h1>Payment Failed: ${order.order_status}</h1>`);
        }
    } catch (error) {
        res.status(500).send("Error verifying payment.");
    }
});

// 11. START SERVER
app.listen(PORT, () => {
    console.log(`🚀 CodeLadder Server running at http://localhost:${PORT}`);
});
// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// require('dotenv').config();
// const { GoogleGenerativeAI } = require("@google/generative-ai");

// const app = express();
// const PORT = 5000;

// app.use(cors());
// app.use(bodyParser.json());

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// app.post("/generate-plan", async (req, res) => {
//   try {
//     const { subjects, deadlines, freeHours } = req.body;
//     const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash-pro" });

//     const prompt = `Create a study plan for these subjects: ${subjects.join(", ")}, 
//     with deadlines: ${JSON.stringify(deadlines)}, 
//     and ${freeHours} free hours per day.`;


//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();

//     res.json({ plan: text });
//   } catch (error) {
//     console.error("Gemini error:", error);
//     res.status(500).json({ error: "Failed to generate plan." });
//   }
// });





// app.listen(PORT, () => {
//   console.log(`✅ Server is running at http://localhost:${PORT}`);
// });













const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Gemini API key is missing. Please check your .env file.");
}


app.post("/generate-plan", async (req, res) => {
  try {
    const { subjects, deadlines, freeHours, extraNotes } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // or use gemini-1.5-pro
const prompt = `
You are a smart and simple study planner. Based on the following details:

- Subjects: ${subjects.join(", ")}
- Deadlines: ${JSON.stringify(deadlines, null, 2)}
- Free Hours per Day: ${freeHours}
- Extra Notes: ${extraNotes || "None"}

Task 1: Create a clear, student-friendly, day-wise study plan.
- Divide time smartly among subjects based on deadlines and available hours.
- Include short reminders for deadlines.
- Make the tone friendly and helpful.
- Use plain text only, without emojis or special symbols.
- Format it neatly using bullet points or numbers for each day.

Task 2: For each subject, suggest the top 3 free and accessible online study resources.
- Format like this:
  1. Resource Name  
     Link: (URL)  
     Why it’s helpful: One short line

- No emojis, no fancy formatting. Just simple and clean lines.
- Separate each subject by a clear heading like "Resources for [Subject]".

Keep the entire output very readable and organized using simple formatting only.
`;



    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ plan: text });
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: "Failed to generate plan." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});








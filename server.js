require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { google } = require('googleapis');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'a_very_secret_key_for_session', // It's better to use a long, random string from .env
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if you are using HTTPS
}));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Check for missing environment variables on startup
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ FATAL ERROR: Gemini API key is missing. Please check your .env file.");
  process.exit(1);
}
if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.REDIRECT_URI) {
    console.error("❌ FATAL ERROR: Google OAuth credentials (CLIENT_ID, CLIENT_SECRET, REDIRECT_URI) are missing. Please check your .env file.");
    process.exit(1);
}


// Route to start Google authentication
app.get('/auth/google', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly'
  ];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });
  res.redirect(url);
});

// Route to handle the OAuth2 callback
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    req.session.tokens = tokens;
    console.log("✅ Successfully retrieved and stored tokens.");
    res.redirect('/'); // Redirect back to the main page
  } catch (error) {
    console.error('❌ Error retrieving access token. Full error:', error);
    res.redirect('/?error=auth_failed');
  }
});

// API to check authentication status
app.get('/api/auth-status', (req, res) => {
  if (req.session.tokens) {
    res.json({ isAuthenticated: true });
  } else {
    res.json({ isAuthenticated: false });
  }
});

app.post("/generate-plan", async (req, res) => {
  try {
    const { subjects, deadlines, freeHours, extraNotes, useCalendar } = req.body;

    let availabilityPrompt;

    if (useCalendar && req.session.tokens) {
      oauth2Client.setCredentials(req.session.tokens);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const now = new Date();
      const timeMax = new Date();
      timeMax.setDate(now.getDate() + 14); // Look ahead 14 days

      const result = await calendar.freebusy.query({
        requestBody: {
          timeMin: now.toISOString(),
          timeMax: timeMax.toISOString(),
          items: [{ id: 'primary' }],
        },
      });

      const busySlots = result.data.calendars.primary.busy;
      availabilityPrompt = `Base the study plan on the user's free time. Here are their busy slots from Google Calendar for the next 14 days: ${JSON.stringify(busySlots)}. Assume study can happen between 8am and 10pm on any day.`;

    } else {
      if (!freeHours) {
        return res.status(400).json({ error: "Manual free hours are required when not using Google Calendar." });
      }
      availabilityPrompt = `The user has specified they have ${freeHours} free hours per day to study.`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are a smart and simple study planner. Based on the following details:

      - Subjects: ${subjects.join(", ")}
      - Deadlines: ${JSON.stringify(deadlines, null, 2)}
      - Availability: ${availabilityPrompt}
      - Extra Notes: ${extraNotes || "None"}

      Task: Create a clear, student-friendly, day-wise study plan.
      - Divide time smartly among subjects based on deadlines and available hours/slots.
      - Include short reminders for deadlines.
      - Make the tone friendly and helpful.
      - Format it neatly using bullet points or numbers for each day.
    `;

    const generationResult = await model.generateContent(prompt);
    const response = await generationResult.response;
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

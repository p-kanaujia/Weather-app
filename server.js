const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENWEATHER_API_KEY || '';

// Serve static files from project root
app.use(express.static(path.join(__dirname)));

// Simple endpoint to return the API key to the client (only for local usage)
app.get('/api/key', (req, res) => {
  if (!API_KEY) return res.status(404).json({ error: 'no_key' });
  return res.json({ key: API_KEY });
});

app.listen(PORT, () => {
  console.log(`Weather app server running at http://localhost:${PORT}`);
});

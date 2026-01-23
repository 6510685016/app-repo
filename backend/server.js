const express = require('express');
const cors = require('cors');
const os = require("os");

const app = express();
const PORT = 5000;

app.use(cors());

app.get('/api/message', (req, res) => {
  res.json({
    message: "Hello from Backend API 🚀",
    version: process.env.APP_VERSION || "unknown",
    hostname: os.hostname(),
  });
});


app.get('/health', (req, res) => {
  res.status(200).json({ status: "ok" });
});



app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

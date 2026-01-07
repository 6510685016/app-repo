const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());

app.get('/api/message', (req, res) => {
  res.json({
    message: 'Hello from Backend API 🚀'
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

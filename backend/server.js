const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());

app.get('/api/message', (req, res) => {
  const hostname = os.hostname();
  res.json({
    message: 'Hello from Backend API 🚀',
    hostname
  });
});


app.get('/health', (req, res) => {
  res.status(200).json({ status: "ok" });
});



app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

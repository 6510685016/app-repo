const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('<h1>Hello from GitOps Flow!</h1><p>Status: Running</p>');
});

app.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
});
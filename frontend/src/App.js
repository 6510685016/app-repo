import React, { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    fetch('http://backend:5000/api/message')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage('Error connecting to backend'));
  }, []);

  return (
    <div style={{ padding: '40px', fontSize: '24px' }}>
      <h1>Frontend</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;

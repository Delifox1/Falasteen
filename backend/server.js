const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'Delifox786',
  database: 'virtual_solidarity_wall',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Middleware
app.use(bodyParser.json());

// Serve static files from the 'frontend' folder
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Serve static files from the 'fonts' folder
app.use('/fonts', express.static(path.join(__dirname, 'fonts')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.get('/messages', (req, res) => {
  // Retrieve messages from MySQL database
  pool.query('SELECT * FROM messages', (error, results) => {
    if (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});


app.post('/messages', (req, res) => {
  const newMessageText = req.body.message;

  // Insert new message into MySQL database
  pool.query('INSERT INTO messages (text, reported) VALUES (?, ?)', [newMessageText, false], (error, results) => {
    if (error) {
      console.error('Error posting message:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json({ message: 'Message added successfully', messageId: results.insertId });
    }
  });
});


app.post('/report', (req, res) => {
  const messageId = req.body.messageId;

  // Update the 'reported' column in the 'messages' table to true
  pool.query('UPDATE messages SET reported = true WHERE id = ?', [messageId], (error) => {
    if (error) {
      console.error('Error reporting message:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json({ message: 'Message reported successfully' });
    }
  });
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const functions = require('firebase-functions');
const express = require('express');

const app = express();

// Example API route
app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// TODO: You can proxy or re-implement your main Express server routes here

exports.api = functions.https.onRequest(app);

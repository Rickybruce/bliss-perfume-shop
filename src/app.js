// Load .env first so every file required below can read process.env
require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const db = require('./config/db');

const app = express();

app.use(helmet());
app.use(compression());

// Later: mount the Paystack webhook route HERE, before express.json().
// It needs the raw request body to check the signature.

app.use(express.json());
app.use(cookieParser());

// Quick check that the server is up and MySQL is reachable
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error('Health check failed:', err.message);
    res.status(500).json({ status: 'error', database: 'unreachable' });
  }
});

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// Serves everything in public/, e.g. http://localhost:3000/signup.html
app.use(express.static(path.join(__dirname, '..', 'public')));

module.exports = app;
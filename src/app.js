// Load .env first so every file required below can read process.env
require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const db = require('./config/db');
const { checkEnv } = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const adminRoutes = require('./routes/admin.routes');
const pickupRoutes = require('./routes/pickup.routes');
const errorHandler = require('./middleware/error-handler.middleware');

checkEnv();

const app = express();

// Default helmet CSP only allows images from this server. Product images are
// hosted on Cloudinary, so that host is allowed for <img> as well.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'https://res.cloudinary.com'],
      },
    },
  })
);
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

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/pickups', pickupRoutes);

// Serves everything in public/, e.g. http://localhost:3000/signup.html
app.use(express.static(path.join(__dirname, '..', 'public')));

// Anything that reaches here matched no route or static file.
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Not found.' });
});
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', 'public', '404.html'));
});

// Must be registered after every route above.
app.use(errorHandler);

module.exports = app;
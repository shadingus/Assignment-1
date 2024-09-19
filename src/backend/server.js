require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const socketHandler = require('./sockets');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "DELETE"]
  },
  pingTimeout: 60000, // 60 seconds timeout
  pingInterval: 25000, // Keep-alive interval to prevent connection drops
});


app.get('/src/styles.css', (req, res) => {
  res.set('Content-Type', 'text/css');
  res.sendFile(path.join(__dirname, 'public/styles.css'));
});

app.use(cors({ origin: process.env.CORS_ORIGIN, methods: ["GET", "POST", "DELETE"], allowedHeaders: ["Content-Type"] }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

const staticPath = path.join(__dirname, '../../dist/assignment-1/browser');
app.use(express.static(staticPath));

const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const banRoutes = require('./routes/bans');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/ban', banRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

socketHandler(io);

app.use((err, req, res, next) => {
  if (err.status === 400) {
    console.log(`Bad Request: ${err.message}`);
    return res.status(400).json({ message: err.message });
  }

  if (err.status === 404) {
    console.error(`Not Found: ${req.url}`);
    return res.status(404).json({ message: 'Not Found' });
  }

  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

function gracefulShutdown() {
  console.log('Gracefully shutting down...');
  io.emit('serverShutdown', 'Server is shutting down...');

  server.close((err) => {
    if (err) {
      console.error('Error during shutdown:', err);
      process.exitCode = 1;
    };
    console.log('Closed remaining connections.');
    process.exit();
  });

  setTimeout(() => {
    console.error('Forcing shutdown...');
    process.exitCode = 1;
    process.exit();
  }, 5000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = server;
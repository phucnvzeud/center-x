require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const { setApp } = require('./utils/notificationQueue');

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join a user-specific room for targeted notifications
  socket.on('join', (userId) => {
    if (userId) {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their notification room`);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to other modules
app.set('io', io);

// Connect notification queue to express app
setApp(app);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/branches', require('./routes/branchRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/regions', require('./routes/regions'));
app.use('/api/schools', require('./routes/schools'));
app.use('/api/kindergarten-classes', require('./routes/kindergartenClasses'));
app.use('/api/holidays', require('./routes/holidaysRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'Server is healthy', 
    env: process.env.NODE_ENV,
    directory: __dirname,
    frontendBuildExists: fs.existsSync(path.join(__dirname, '../frontend/build')),
    frontendIndexExists: fs.existsSync(path.join(__dirname, '../frontend/build/index.html'))
  });
});

// Debug route to check environment
app.get('/api/debug', (req, res) => {
  res.status(200).json({
    env: process.env.NODE_ENV,
    node_version: process.version,
    current_dir: __dirname,
    parent_dir_contents: fs.readdirSync(path.join(__dirname, '..')),
    frontend_dir_exists: fs.existsSync(path.join(__dirname, '../frontend')),
    build_dir_exists: fs.existsSync(path.join(__dirname, '../frontend/build')),
    index_exists: fs.existsSync(path.join(__dirname, '../frontend/build/index.html'))
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  console.log('Running in PRODUCTION mode, serving static files');
  
  const staticPath = path.join(__dirname, '../frontend/build');
  console.log(`Static path: ${staticPath}`);
  console.log(`Static path exists: ${fs.existsSync(staticPath)}`);
  
  if (fs.existsSync(staticPath)) {
    // List files in the static directory for debugging
    console.log(`Files in ${staticPath}:`, fs.readdirSync(staticPath));
  }
  
  // Set static folder
  app.use(express.static(staticPath));

  // Any route that is not an API route will be redirected to the React app
  app.get('*', (req, res) => {
    const indexPath = path.resolve(__dirname, '../frontend/build', 'index.html');
    console.log(`Requested path: ${req.path}`);
    console.log(`Serving index from: ${indexPath} (Production)`);
    console.log(`Index exists: ${fs.existsSync(indexPath)}`);
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend build not found. Make sure the frontend was built correctly.');
    }
  });
} else {
  console.log('Running in DEVELOPMENT mode');
  // In development, also serve index.html for non-API routes to support client-side routing
  // This is helpful if requests for frontend routes accidentally hit the backend server directly.
  // The primary way to access the app in dev is via the frontend dev server (e.g., localhost:3000).
  
  // Serve static assets from public (if any are directly referenced and not handled by frontend dev server)
  const publicPath = path.join(__dirname, '../frontend/public');
  app.use(express.static(publicPath));
  
  app.get('*', (req, res) => {
    // Check if the request is for an API endpoint. If so, this catch-all shouldn't handle it.
    // API routes should have been handled before this point.
    if (req.path.startsWith('/api/')) {
      return res.status(404).send(`API endpoint ${req.path} not found.`);
    }

    // For non-API routes, serve the main index.html from the public folder (typical for create-react-app dev setup)
    const indexPath = path.resolve(__dirname, '../frontend/public', 'index.html');
    console.log(`Requested path: ${req.path}`);
    console.log(`Serving index from: ${indexPath} (Development)`);
    console.log(`Index exists: ${fs.existsSync(indexPath)}`);

    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Fallback if public/index.html isn't found - this indicates a setup issue
      res.status(404).send('Development index.html not found. Ensure frontend is running or paths are correct.');
    }
  });
}

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Current directory: ${__dirname}`);
  console.log(`Frontend build directory exists: ${fs.existsSync(path.join(__dirname, '../frontend/build'))}`);
});

// For testing purposes
module.exports = app;
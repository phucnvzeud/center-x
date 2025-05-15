require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5001; // Changed from 5000 to 5001 to avoid port conflict

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
    console.log(`Serving index from: ${indexPath}`);
    console.log(`Index exists: ${fs.existsSync(indexPath)}`);
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend build not found. Make sure the frontend was built correctly.');
    }
  });
} else {
  console.log('Running in DEVELOPMENT mode');
  // In development, add a catch-all route for non-API routes
  app.get('*', (req, res) => {
    res.status(404).send('API server running in development mode. Frontend should be served separately.');
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Current directory: ${__dirname}`);
  console.log(`Frontend build directory exists: ${fs.existsSync(path.join(__dirname, '../frontend/build'))}`);
});

// For testing purposes
module.exports = app;
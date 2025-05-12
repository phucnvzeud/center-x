#!/bin/bash
set -e

# Echo current directory
echo "Current directory: $(pwd)"
echo "Listing root directory contents:"
ls -la

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install

# Fix permissions for react-scripts
echo "Fixing permissions for react-scripts..."
chmod +x node_modules/.bin/react-scripts
chmod +x node_modules/react-scripts/bin/react-scripts.js

# Build the frontend
echo "Building the frontend..."
DISABLE_ESLINT_PLUGIN=true npm run build

# Verify build output
echo "Checking build output..."
ls -la build

# Go back to root
cd ..

# Make sure the frontend/build directory exists
echo "Checking if frontend/build directory exists..."
if [ -d "frontend/build" ]; then
  echo "frontend/build directory exists"
  echo "Contents of frontend/build:"
  ls -la frontend/build
else
  echo "ERROR: frontend/build directory does not exist!"
  exit 1
fi

# Set environment variable for production
echo "Setting NODE_ENV=production for deployment"
export NODE_ENV=production 
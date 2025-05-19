const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting frontend build process...');

// Define paths
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');

try {
  // Navigate to frontend directory and install dependencies
  console.log('Installing frontend dependencies...');
  execSync('npm install --legacy-peer-deps', { 
    cwd: frontendDir, 
    stdio: 'inherit' 
  });

  // Build the frontend (using .env file for environment variables)
  console.log('Building frontend...');
  execSync('npm run build', { 
    cwd: frontendDir, 
    stdio: 'inherit'
  });

  console.log('Frontend build completed successfully!');

  // Create a public directory in the backend if it doesn't exist
  const backendPublicDir = path.join(rootDir, 'backend', 'public');
  if (!fs.existsSync(backendPublicDir)) {
    console.log('Creating public directory in backend...');
    fs.mkdirSync(backendPublicDir, { recursive: true });
  }

  // Copy the built frontend to the backend's public directory (cross-platform)
  console.log('Copying frontend build to backend/public...');
  
  // Source directory (frontend build)
  const sourceBuildDir = path.join(frontendDir, 'build');
  
  // Function to copy directory recursively
  const copyRecursive = (source, target) => {
    // Create target directory if it doesn't exist
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }
    
    // Read all files/directories from source
    const entries = fs.readdirSync(source, { withFileTypes: true });
    
    // Process each entry
    for (const entry of entries) {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(target, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively copy directory
        copyRecursive(srcPath, destPath);
      } else {
        // Copy file
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  
  // Perform the copy
  copyRecursive(sourceBuildDir, backendPublicDir);

  console.log('Frontend build successfully copied to backend!');
  
} catch (error) {
  console.error('Error during frontend build process:', error);
  process.exit(1);
} 
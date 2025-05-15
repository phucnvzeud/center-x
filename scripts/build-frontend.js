const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting frontend build script...');

// Log the current directory
const currentDir = process.cwd();
console.log(`Current directory: ${currentDir}`);

// Navigate to frontend directory
const frontendDir = path.join(currentDir, 'frontend');
console.log(`Checking if frontend directory exists: ${fs.existsSync(frontendDir)}`);

try {
  // Install frontend dependencies
  console.log('Installing frontend dependencies...');
  execSync('cd frontend && npm install --legacy-peer-deps', { stdio: 'inherit' });
  
  // Override problematic ajv dependencies
  console.log('Overriding ajv dependencies...');
  execSync('cd frontend && npm install ajv@8.12.0 ajv-keywords@5.1.0 --legacy-peer-deps', { stdio: 'inherit' });
  
  // Fix permissions for react-scripts
  console.log('Fixing permissions for react-scripts...');
  execSync('cd frontend && chmod +x node_modules/.bin/react-scripts', { stdio: 'inherit' });
  execSync('cd frontend && chmod +x node_modules/react-scripts/bin/react-scripts.js', { stdio: 'inherit' });
  
  // Build frontend
  console.log('Building frontend...');
  execSync('cd frontend && DISABLE_ESLINT_PLUGIN=true CI=false npm run build', { stdio: 'inherit' });
  
  // Verify build directory exists
  const buildDir = path.join(frontendDir, 'build');
  if (fs.existsSync(buildDir)) {
    console.log('Build directory created successfully!');
    console.log('Contents of build directory:');
    const buildContents = fs.readdirSync(buildDir);
    console.log(buildContents);
    
    // Check if index.html exists
    const indexPath = path.join(buildDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log('index.html exists in the build directory!');
    } else {
      console.error('ERROR: index.html does not exist in the build directory!');
      process.exit(1);
    }
  } else {
    console.error('ERROR: Build directory was not created!');
    process.exit(1);
  }
  
  console.log('Frontend build completed successfully!');
} catch (error) {
  console.error(`Error building frontend: ${error.message}`);
  process.exit(1);
} 
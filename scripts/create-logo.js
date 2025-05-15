const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create directory if it doesn't exist
const publicDir = path.join(__dirname, '../frontend/public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create 192x192 logo
function createLogo(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#2979ff');
  gradient.addColorStop(1, '#73bc62');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Text
  const fontSize = size * 0.5;
  ctx.font = `bold ${fontSize}px Poppins, sans-serif`;
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CX', size / 2, size / 2);

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(publicDir, filename), buffer);
  console.log(`Created ${filename}`);
}

// Create logos
createLogo(192, 'logo192.png');
createLogo(512, 'logo512.png');

console.log('Logo files created successfully!'); 
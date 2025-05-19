/**
 * find-untranslated-text.js
 * 
 * A script to identify potential hard-coded text in React components that might need translation.
 * This script searches for JSX text that is not wrapped in a t() function call.
 * 
 * Run with: node scripts/find-untranslated-text.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to search for potentially hardcoded text in JSX
const TEXT_PATTERNS = [
  // Potential hardcoded text in JSX elements
  /<([A-Za-z][A-Za-z0-9]*)>([^<>{}/\n]+?)<\/\1>/g,
  // Text in common components
  /<(Text|Heading|Button|Label|Title)[^>]*>([^<>{}/\n]+?)<\//g,
  // Button text
  /Button[^>]*>\s*([A-Z][a-zA-Z\s]+)\s*</g,
  // MenuItem text
  /<MenuItem[^>]*>[^<]*?([A-Z][a-zA-Z\s]+)\s*</g,
  // Placeholder text
  /placeholder=["']([^"']+)["']/g,
  // Modal header text
  /<ModalHeader[^>]*>([^<>{}/\n]+?)</g,
  // Tab text
  /<Tab[^>]*>([^<>{}/\n]+?)</g
];

// Patterns to ignore
const IGNORE_PATTERNS = [
  // t() translation function calls
  /\{t\(['"].*?['"]\)\}/,
  // Dynamic expressions
  /\{.*?\}/,
  // Variable references
  /\{[a-zA-Z0-9_]+\}/,
  // Common variable names and single words
  /^[a-z0-9_]+$/i,
  // Common patterns to skip
  /^(https?:\/\/|\$|#|[0-9]+%|\d+\.\d+|[0-9]+px)$/i,
  // HTML entities
  /&[a-z]+;/i
];

// File/directory patterns to exclude
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/build/**',
  '**/dist/**',
  '**/.git/**',
  '**/i18n.js',
  '**/i18n/**',
  '**/locales/**',
  '**/*.test.js',
  '**/*.spec.js',
  '**/test/**'
];

// Count statistics
let filesScanned = 0;
let potentialTextsFound = 0;

// Main function
function findUntranslatedText(sourceDir) {
  console.log(`Scanning ${sourceDir} for untranslated text...`);

  const files = glob.sync(`${sourceDir}/**/*.{js,jsx,tsx}`, {
    ignore: EXCLUDE_PATTERNS
  });

  console.log(`Found ${files.length} files to scan\n`);

  const results = {};

  files.forEach(file => {
    filesScanned++;
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(process.cwd(), file);
    let fileMatches = [];

    TEXT_PATTERNS.forEach(pattern => {
      const matches = [...content.matchAll(pattern)];
      
      matches.forEach(match => {
        // Find the text group, which is usually group 2 but could be group 1 in some patterns
        const textGroup = match[2] || match[1];
        
        if (!textGroup) return;
        
        const text = textGroup.trim();
        
        // Skip if text matches any of the ignore patterns
        if (text.length < 3 || IGNORE_PATTERNS.some(p => p.test(text))) {
          return;
        }
        
        // Skip if text is already in a translation function call
        const matchStart = match.index;
        const contextBefore = content.substring(Math.max(0, matchStart - 30), matchStart);
        if (contextBefore.includes('t(') || contextBefore.includes('.t(') || 
            contextBefore.includes('trans(') || contextBefore.includes('i18n.')) {
          return;
        }
        
        // Get line number
        const lineNumber = content.substring(0, matchStart).split('\n').length;
        
        fileMatches.push({
          text,
          lineNumber
        });
        
        potentialTextsFound++;
      });
    });
    
    if (fileMatches.length > 0) {
      results[relativePath] = fileMatches;
    }
  });

  // Output results
  console.log('='.repeat(80));
  console.log('UNTRANSLATED TEXT REPORT');
  console.log('='.repeat(80));
  console.log(`Files scanned: ${filesScanned}`);
  console.log(`Potential untranslated texts found: ${potentialTextsFound}\n`);
  
  Object.entries(results).forEach(([file, matches]) => {
    console.log(`\n${file}:`);
    matches.forEach(match => {
      console.log(`  Line ${match.lineNumber}: "${match.text}"`);
    });
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('NOTE: This is an automated scan and may include false positives.');
  console.log('      Not all detected text needs to be translated.');
  console.log('='.repeat(80));
}

// Run the script
const targetDir = process.argv[2] || 'frontend/src';
findUntranslatedText(targetDir); 
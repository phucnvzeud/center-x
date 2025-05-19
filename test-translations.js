// Simple script to validate translations
const enTranslations = require('./frontend/public/locales/en/common.json');
const viTranslations = require('./frontend/public/locales/vi/common.json');

// Log first level keys to see structure
console.log('English translation keys:', Object.keys(enTranslations));
console.log('Vietnamese translation keys:', Object.keys(viTranslations));

// Check if course_management exists in both
console.log('\nEnglish has course_management:', enTranslations.hasOwnProperty('course_management'));
console.log('Vietnamese has course_management:', viTranslations.hasOwnProperty('course_management'));

// Print course_management structure if it exists
if (enTranslations.course_management) {
  console.log('\nEnglish course_management keys:', Object.keys(enTranslations.course_management));
}
if (viTranslations.course_management) {
  console.log('Vietnamese course_management keys:', Object.keys(viTranslations.course_management));
}

// Test if all course management related translations exist in both languages
function validateTranslations() {
  const missingViKeys = [];
  
  function checkKeys(obj, viObj, prefix = '') {
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        // If it's a nested object, recurse
        if (!viObj[key] || typeof viObj[key] !== 'object') {
          missingViKeys.push(`Missing nested object: ${fullKey}`);
        } else {
          checkKeys(obj[key], viObj[key], fullKey);
        }
      } else {
        // It's a leaf node, check if it exists in Vietnamese
        if (viObj[key] === undefined) {
          missingViKeys.push(`Missing Vietnamese translation: ${fullKey}`);
        }
      }
    });
  }
  
  // Check course related keys specifically 
  ['courses', 'course_management'].forEach(section => {
    if (enTranslations[section] && viTranslations[section]) {
      checkKeys(enTranslations[section], viTranslations[section], section);
    } else {
      missingViKeys.push(`Missing entire section: ${section}`);
    }
  });
  
  return missingViKeys;
}

const missingTranslations = validateTranslations();

if (missingTranslations.length === 0) {
  console.log('\n✅ All course-related translations exist in both English and Vietnamese!');
} else {
  console.log('\n❌ Some translations are missing in Vietnamese:');
  missingTranslations.forEach(missing => {
    console.log(`  - ${missing}`);
  });
} 
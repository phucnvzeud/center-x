/**
 * Test script to verify the notification system
 * 
 * Run with: node backend/scripts/testNotifications.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Course, Teacher, Branch } = require('../models');
const Notification = require('../models/Notification');
const { queueNotification, checkQueueSystem } = require('../utils/notificationQueue');

// Connect to MongoDB directly with fallback
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/languagecenter';
console.log('Connecting to MongoDB at:', MONGO_URI);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected for notification tests');
    runTests();
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

// Helper function to wait for a specified time
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main test function
async function runTests() {
  try {
    console.log('\n=== NOTIFICATION SYSTEM TEST ===\n');

    // Check if the notification system is working
    console.log('1. Testing direct notification creation...');
    
    // Create a notification directly without using the queue
    const testId = new mongoose.Types.ObjectId(); // Use a proper ObjectId
    const notification = new Notification({
      message: 'Direct test notification',
      type: 'info',
      entityType: 'test', // Using test as entityType
      entityId: testId,
      action: 'test', // Using test as action
      link: '/'
    });
    
    await notification.save();
    console.log('Direct notification created successfully:', notification._id);
    
    // Test the queue
    console.log('\n2. Testing notification queue...');
    const queueTestId = new mongoose.Types.ObjectId();
    queueNotification(
      'test', // Using test entityType
      queueTestId,
      'test', // Using test action
      'Test Queue Notification',
      { customMessage: 'This is a queued test notification' }
    );
    
    console.log('Queued test notification with ID:', queueTestId);
    console.log('Waiting for queue processing...');
    await wait(3000);
    
    const queuedNotification = await Notification.findOne({ 
      entityId: queueTestId
    });
    
    if (queuedNotification) {
      console.log('✅ Queued notification found:', queuedNotification._id);
    } else {
      console.log('❌ Queued notification NOT found');
    }
    
    // Test course creation
    console.log('\n3. Testing course creation hook...');
    
    // Create a test course with minimal required fields
    const testBranch = await Branch.findOne() || 
      await Branch.create({ name: 'Test Branch' });
    
    const testTeacher = await Teacher.findOne() ||
      await Teacher.create({ 
        name: 'Test Teacher', 
        email: `test${Date.now()}@example.com`,
        phone: '123-456-7890'
      });
    
    const testCourse = new Course({
      name: `Test Course ${Date.now()}`,
      branch: testBranch._id,
      teacher: testTeacher._id,
      startDate: new Date(),
      totalSessions: 10,
      level: 'Beginner',
      price: 100,
      weeklySchedule: [{ day: 'Monday', startTime: '09:00', endTime: '10:00' }]
    });
    
    await testCourse.save();
    console.log('Created test course:', testCourse._id);
    
    // Wait for queue processing
    console.log('Waiting for queue processing...');
    await wait(3000);
    
    // Check for course creation notification
    const courseNotification = await Notification.findOne({
      entityType: 'course',
      entityId: testCourse._id,
      action: 'create'
    });
    
    if (courseNotification) {
      console.log('✅ Course creation notification found:', courseNotification._id);
    } else {
      console.log('❌ Course creation notification NOT found');
    }
    
    // Final report
    console.log('\n4. Final notification count:');
    const finalCount = await Notification.countDocuments();
    console.log(`Total notifications in database: ${finalCount}`);
    
    // Exit gracefully
    console.log('\nTests completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    try {
      await mongoose.disconnect();
    } catch (err) {
      // Ignore disconnection errors
    }
    process.exit(1);
  }
}

// Run the tests
runTests(); 
/**
 * Simple script to test the notification queue system directly
 * Run with: node test-notification.js
 */

// Load essential modules
require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const { queueNotification } = require('./utils/notificationQueue');

// Connect to MongoDB directly
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/languagecenter';
console.log('Connecting to MongoDB at:', MONGO_URI);

// Test function
async function testNotification() {
  try {
    // Connect to database
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Create a proper ObjectId for testing
    const testId = new mongoose.Types.ObjectId();
    console.log('Generated test ID:', testId);

    // 1. Create a direct notification
    console.log('Creating direct notification...');
    const directNotification = new Notification({
      message: 'Direct test notification',
      type: 'info',
      entityType: 'test',
      entityId: testId,
      action: 'test',
      link: '/'
    });

    const savedNotification = await directNotification.save();
    console.log('Direct notification created:', savedNotification._id);

    // 2. Test the queue system
    console.log('Adding notification to queue...');
    const queuedId = new mongoose.Types.ObjectId();
    queueNotification(
      'test',
      queuedId,
      'test',
      'Queue Test',
      { customMessage: 'This is a queued notification test' }
    );

    console.log('Waiting for queue processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if queued notification was created
    const queuedNotification = await Notification.findOne({ entityId: queuedId });
    if (queuedNotification) {
      console.log('Queued notification created successfully:', queuedNotification._id);
    } else {
      console.log('Failed to create queued notification');
    }

    // List all notifications
    const count = await Notification.countDocuments();
    console.log(`Total notifications in database: ${count}`);

    const latest = await Notification.find().sort({createdAt: -1}).limit(5);
    console.log('Latest 5 notifications:');
    latest.forEach(n => {
      console.log(` - ${n._id}: ${n.message} (${n.entityType}, ${n.action})`);
    });

    console.log('Test completed successfully.');
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

// Run the test
testNotification(); 
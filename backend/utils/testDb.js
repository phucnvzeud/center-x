const mongoose = require('mongoose');
const { Teacher, Student, Course, Enrollment } = require('../models');

// MongoDB connection for test database
const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb+srv://dedzeud:Samurai1606@dedfinance.us8qhwr.mongodb.net/language-center-test?retryWrites=true&w=majority&appName=dedfinance';

// Connect to test database
const connectTestDb = async () => {
  try {
    await mongoose.connect(TEST_MONGO_URI);
    console.log('Connected to test database');
  } catch (error) {
    console.error('Error connecting to test database:', error);
    throw error;
  }
};

// Clear all collections in the test database
const clearTestDb = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Attempted to clear non-test database! Operation aborted.');
  }
  
  try {
    const collections = Object.values(mongoose.connection.collections);
    for (const collection of collections) {
      await collection.deleteMany({});
    }
    console.log('Test database cleared');
  } catch (error) {
    console.error('Error clearing test database:', error);
    throw error;
  }
};

// Disconnect from test database
const disconnectTestDb = async () => {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from test database');
  } catch (error) {
    console.error('Error disconnecting from test database:', error);
    throw error;
  }
};

// Sample data for testing
const seedTestDb = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Attempted to seed non-test database! Operation aborted.');
  }
  
  try {
    // Create teachers
    const teacher1 = await Teacher.create({
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '123-456-7890',
      specialization: 'Grammar and Composition',
      qualification: 'MA TESOL',
      availability: [
        { day: 'Monday', startTime: '09:00', endTime: '15:00' },
        { day: 'Wednesday', startTime: '09:00', endTime: '15:00' },
        { day: 'Friday', startTime: '09:00', endTime: '15:00' }
      ]
    });
    
    const teacher2 = await Teacher.create({
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '987-654-3210',
      specialization: 'Conversation and Pronunciation',
      qualification: 'BA English',
      availability: [
        { day: 'Tuesday', startTime: '13:00', endTime: '19:00' },
        { day: 'Thursday', startTime: '13:00', endTime: '19:00' },
        { day: 'Saturday', startTime: '10:00', endTime: '16:00' }
      ]
    });
    
    // Create students
    const student1 = await Student.create({
      name: 'Alice Johnson',
      email: 'alice.johnson@example.com',
      phone: '111-222-3333',
      dateOfBirth: new Date('1995-05-15'),
      address: '123 Main St',
      languageLevel: 'Intermediate'
    });
    
    const student2 = await Student.create({
      name: 'Bob Williams',
      email: 'bob.williams@example.com',
      phone: '444-555-6666',
      dateOfBirth: new Date('1990-08-23'),
      address: '456 Oak Ave',
      languageLevel: 'Beginner'
    });
    
    const student3 = await Student.create({
      name: 'Carol Martinez',
      email: 'carol.martinez@example.com',
      phone: '777-888-9999',
      dateOfBirth: new Date('1998-12-10'),
      address: '789 Pine St',
      languageLevel: 'Advanced'
    });
    
    // Create courses
    const now = new Date();
    const twoMonthsFromNow = new Date(now);
    twoMonthsFromNow.setMonth(now.getMonth() + 2);
    
    const course1 = new Course({
      name: 'English Grammar Fundamentals',
      branch: 'Downtown',
      teacher: teacher1._id,
      startDate: now,
      totalSessions: 16,
      weeklySchedule: [
        { day: 'Monday', startTime: '10:00', endTime: '12:00' },
        { day: 'Wednesday', startTime: '10:00', endTime: '12:00' }
      ],
      description: 'A course focused on building strong grammar foundations',
      level: 'Beginner',
      price: 300
    });
    await course1.save();
    
    const course2 = new Course({
      name: 'Advanced Conversation',
      branch: 'Westside',
      teacher: teacher2._id,
      startDate: now,
      totalSessions: 24,
      weeklySchedule: [
        { day: 'Tuesday', startTime: '15:00', endTime: '17:00' },
        { day: 'Thursday', startTime: '15:00', endTime: '17:00' }
      ],
      description: 'Practice conversational English with a focus on fluency',
      level: 'Advanced',
      price: 450
    });
    await course2.save();
    
    // Create enrollments
    const enrollment1 = await Enrollment.create({
      student: student1._id,
      course: course1._id,
      enrollmentDate: new Date(now.setDate(now.getDate() - 5)),
      totalAmount: 300,
      paymentStatus: 'Paid',
      amountPaid: 300
    });
    
    const enrollment2 = await Enrollment.create({
      student: student2._id,
      course: course1._id,
      enrollmentDate: new Date(now.setDate(now.getDate() - 3)),
      totalAmount: 300,
      paymentStatus: 'Partial',
      amountPaid: 150
    });
    
    const enrollment3 = await Enrollment.create({
      student: student3._id,
      course: course2._id,
      enrollmentDate: new Date(now.setDate(now.getDate() - 7)),
      totalAmount: 450,
      paymentStatus: 'Paid',
      amountPaid: 450
    });
    
    console.log('Test database seeded with sample data');
    
    return {
      teachers: [teacher1, teacher2],
      students: [student1, student2, student3],
      courses: [course1, course2],
      enrollments: [enrollment1, enrollment2, enrollment3]
    };
  } catch (error) {
    console.error('Error seeding test database:', error);
    throw error;
  }
};

// Run a test suite with fresh database
const withTestDb = async (testFunction) => {
  try {
    process.env.NODE_ENV = 'test';
    await connectTestDb();
    await clearTestDb();
    const sampleData = await seedTestDb();
    await testFunction(sampleData);
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  } finally {
    await disconnectTestDb();
  }
};

module.exports = {
  connectTestDb,
  clearTestDb,
  seedTestDb,
  disconnectTestDb,
  withTestDb
}; 
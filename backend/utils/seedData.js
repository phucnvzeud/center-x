const mongoose = require('mongoose');
const { Teacher, Student, Course, Enrollment } = require('../models');
require('dotenv').config();

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://dedzeud:Samurai1606@dedfinance.us8qhwr.mongodb.net/language-center?retryWrites=true&w=majority&appName=dedfinance';

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected for seeding data');
    return mongoose.connection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Seed data
const seedDatabase = async () => {
  try {
    // Check if data already exists
    const teacherCount = await Teacher.countDocuments();
    const studentCount = await Student.countDocuments();
    const courseCount = await Course.countDocuments();
    
    console.log(`Existing data: ${teacherCount} teachers, ${studentCount} students, ${courseCount} courses`);
    
    if (teacherCount > 0 || studentCount > 0 || courseCount > 0) {
      const response = await new Promise(resolve => {
        process.stdout.write('Data already exists. Do you want to clear it and reseed? (y/n): ');
        process.stdin.once('data', data => {
          resolve(data.toString().trim().toLowerCase());
        });
      });
      
      if (response !== 'y') {
        console.log('Seeding cancelled');
        return false;
      }
      
      // Clear existing data
      await Teacher.deleteMany({});
      await Student.deleteMany({});
      await Course.deleteMany({});
      await Enrollment.deleteMany({});
      console.log('Existing data cleared');
    }
    
    // Create teachers
    console.log('Creating teachers...');
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
    
    const teacher3 = await Teacher.create({
      name: 'Michael Johnson',
      email: 'michael.johnson@example.com',
      phone: '555-123-4567',
      specialization: 'Business English',
      qualification: 'PhD Applied Linguistics',
      availability: [
        { day: 'Monday', startTime: '14:00', endTime: '20:00' },
        { day: 'Thursday', startTime: '14:00', endTime: '20:00' }
      ]
    });
    
    // Create students
    console.log('Creating students...');
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
    
    const student4 = await Student.create({
      name: 'David Lee',
      email: 'david.lee@example.com',
      phone: '222-333-4444',
      dateOfBirth: new Date('1992-03-27'),
      address: '101 Maple Dr',
      languageLevel: 'Upper Intermediate'
    });
    
    const student5 = await Student.create({
      name: 'Emma Wilson',
      email: 'emma.wilson@example.com',
      phone: '555-666-7777',
      dateOfBirth: new Date('1997-11-05'),
      address: '202 Cedar Ln',
      languageLevel: 'Elementary'
    });
    
    // Create courses
    console.log('Creating courses...');
    const now = new Date();
    
    // Create a past course (finished)
    const pastStartDate = new Date(now);
    pastStartDate.setMonth(now.getMonth() - 3);
    
    const course1 = new Course({
      name: 'English Grammar Fundamentals',
      branch: 'Downtown',
      teacher: teacher1._id,
      startDate: pastStartDate,
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
    
    // Mark all sessions as taught (finished course)
    course1.sessions.forEach((session, index) => {
      course1.sessions[index].status = 'Taught';
    });
    await course1.save();
    
    // Create an active course (in progress)
    const activeStartDate = new Date(now);
    activeStartDate.setDate(now.getDate() - 14); // Started 2 weeks ago
    
    const course2 = new Course({
      name: 'Advanced Conversation',
      branch: 'Westside',
      teacher: teacher2._id,
      startDate: activeStartDate,
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
    
    // Mark some sessions as taught (about 30% progress)
    const sessionsToMark = Math.floor(course2.sessions.length * 0.3);
    for (let i = 0; i < sessionsToMark; i++) {
      course2.sessions[i].status = 'Taught';
    }
    
    // Add one absent session
    if (sessionsToMark + 1 < course2.sessions.length) {
      course2.sessions[sessionsToMark + 1].status = 'Absent (Holiday)';
      // Add compensatory session
      course2.addCompensatorySession(sessionsToMark + 1);
    }
    
    await course2.save();
    
    // Create an upcoming course
    const futureStartDate = new Date(now);
    futureStartDate.setDate(now.getDate() + 7); // Starts in 1 week
    
    const course3 = new Course({
      name: 'Business English Workshop',
      branch: 'Corporate Center',
      teacher: teacher3._id,
      startDate: futureStartDate,
      totalSessions: 8,
      weeklySchedule: [
        { day: 'Monday', startTime: '18:00', endTime: '20:00' },
        { day: 'Friday', startTime: '18:00', endTime: '20:00' }
      ],
      description: 'Short intensive business English workshop',
      level: 'Upper Intermediate',
      price: 500
    });
    await course3.save();
    
    // Create enrollments
    console.log('Creating enrollments...');
    const enrollment1 = await Enrollment.create({
      student: student1._id,
      course: course1._id,
      enrollmentDate: new Date(pastStartDate.setDate(pastStartDate.getDate() - 5)),
      totalAmount: 300,
      paymentStatus: 'Paid',
      amountPaid: 300,
      status: 'Completed'
    });
    
    const enrollment2 = await Enrollment.create({
      student: student2._id,
      course: course1._id,
      enrollmentDate: new Date(pastStartDate.setDate(pastStartDate.getDate() - 3)),
      totalAmount: 300,
      paymentStatus: 'Paid',
      amountPaid: 300,
      status: 'Completed'
    });
    
    const enrollment3 = await Enrollment.create({
      student: student3._id,
      course: course2._id,
      enrollmentDate: new Date(activeStartDate.setDate(activeStartDate.getDate() - 7)),
      totalAmount: 450,
      paymentStatus: 'Paid',
      amountPaid: 450,
      status: 'Active'
    });
    
    const enrollment4 = await Enrollment.create({
      student: student4._id,
      course: course2._id,
      enrollmentDate: new Date(activeStartDate.setDate(activeStartDate.getDate() - 5)),
      totalAmount: 450,
      paymentStatus: 'Partial',
      amountPaid: 225,
      status: 'Active'
    });
    
    const enrollment5 = await Enrollment.create({
      student: student5._id,
      course: course3._id,
      enrollmentDate: new Date(now),
      totalAmount: 500,
      paymentStatus: 'Pending',
      amountPaid: 0,
      status: 'Active'
    });
    
    const enrollment6 = await Enrollment.create({
      student: student1._id,
      course: course3._id,
      enrollmentDate: new Date(now),
      totalAmount: 500,
      paymentStatus: 'Partial',
      amountPaid: 250,
      status: 'Active'
    });
    
    // Add attendance records for active enrollments
    for (let i = 0; i < sessionsToMark; i++) {
      enrollment3.updateAttendance(course2.sessions[i].date, true);
      enrollment4.updateAttendance(course2.sessions[i].date, i % 3 !== 0); // Occasional absence
    }
    
    await enrollment3.save();
    await enrollment4.save();
    
    console.log('Database seeded successfully');
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
};

// Main function
const runSeed = async () => {
  const conn = await connectDB();
  const success = await seedDatabase();
  
  if (success) {
    console.log('Seeding completed successfully');
  } else {
    console.log('Seeding process terminated');
  }
  
  await mongoose.disconnect();
  console.log('MongoDB connection closed');
  process.exit(0);
};

// Run the seeding process
runSeed(); 
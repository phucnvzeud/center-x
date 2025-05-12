const mongoose = require('mongoose');
const { Student, Course, Enrollment } = require('../models');

// Sample student data
const students = [
  {
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '555-123-4567',
    dateOfBirth: new Date('1995-05-15'),
    address: '123 Main St, Anytown, CA 12345',
    languageLevel: 'Intermediate',
    notes: 'Interested in business English'
  },
  {
    name: 'Maria Garcia',
    email: 'maria.garcia@example.com',
    phone: '555-234-5678',
    dateOfBirth: new Date('1998-08-22'),
    address: '456 Oak Ave, Somewhere, CA 12346',
    languageLevel: 'Advanced',
    notes: 'Planning to take TOEFL next year'
  },
  {
    name: 'Wei Zhang',
    email: 'wei.zhang@example.com',
    phone: '555-345-6789',
    dateOfBirth: new Date('1992-03-10'),
    address: '789 Pine St, Elsewhere, CA 12347',
    languageLevel: 'Upper Intermediate',
    notes: 'Needs help with pronunciation'
  },
  {
    name: 'Sophia Johnson',
    email: 'sophia.johnson@example.com',
    phone: '555-456-7890',
    dateOfBirth: new Date('1997-11-28'),
    address: '101 Maple Dr, Nowhere, CA 12348',
    languageLevel: 'Beginner',
    notes: 'Complete beginner, enthusiastic learner'
  },
  {
    name: 'Ahmed Ali',
    email: 'ahmed.ali@example.com',
    phone: '555-567-8901',
    dateOfBirth: new Date('1990-07-14'),
    address: '202 Cedar Blvd, Anytown, CA 12345',
    languageLevel: 'Elementary',
    notes: 'Focusing on conversational skills'
  }
];

/**
 * Seed the database with sample student data
 */
const seedStudents = async () => {
  try {
    // Clear existing data
    await Student.deleteMany({});
    console.log('Existing students data cleared');
    
    // Insert new data
    const insertedStudents = await Student.insertMany(students);
    console.log(`${insertedStudents.length} students inserted`);
    
    return insertedStudents;
  } catch (error) {
    console.error('Error seeding students:', error);
    throw error;
  }
};

/**
 * Create sample enrollments for students in existing courses
 */
const createSampleEnrollments = async (students) => {
  try {
    // Clear existing enrollments
    await Enrollment.deleteMany({});
    console.log('Existing enrollments cleared');
    
    // Get all active courses
    const courses = await Course.find({ status: 'Active' }).limit(3);
    
    if (courses.length === 0) {
      console.log('No active courses found. Please seed courses first.');
      return [];
    }
    
    const enrollments = [];
    
    // Create enrollments with different payment statuses
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const course = courses[i % courses.length]; // Distribute students across available courses
      
      // Create enrollment with different statuses
      const paymentStatus = i % 3 === 0 ? 'Paid' : (i % 3 === 1 ? 'Partial' : 'Pending');
      const totalAmount = 500;
      const amountPaid = paymentStatus === 'Paid' ? 500 : (paymentStatus === 'Partial' ? 250 : 0);
      
      const enrollment = new Enrollment({
        student: student._id,
        course: course._id,
        status: 'Active',
        totalAmount,
        amountPaid,
        paymentStatus
      });
      
      await enrollment.save();
      enrollments.push(enrollment);
      
      // Update course student count
      course.totalStudent = (course.totalStudent || 0) + 1;
      await course.save();
    }
    
    console.log(`${enrollments.length} sample enrollments created`);
    return enrollments;
  } catch (error) {
    console.error('Error creating sample enrollments:', error);
    throw error;
  }
};

/**
 * Run the seeding process
 */
const seedAll = async () => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected. Please ensure the database is running.');
      return;
    }
    
    console.log('Starting seeding process...');
    
    // Seed students
    const students = await seedStudents();
    
    // Create enrollments
    await createSampleEnrollments(students);
    
    console.log('Seeding completed successfully!');
    
  } catch (error) {
    console.error('Seeding failed:', error);
  }
};

// Export the functions for use in other scripts
module.exports = {
  seedStudents,
  createSampleEnrollments,
  seedAll
};

// If this script is run directly (node seedStudentData.js), execute the seeding
if (require.main === module) {
  seedAll()
    .then(() => {
      console.log('Seeding completed. You can now use the app with sample data.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Seeding failed with error:', err);
      process.exit(1);
    });
} 
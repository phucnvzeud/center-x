/**
 * This script directly updates the database to ensure all courses have enrolledStudents field
 * Run with: node backend/scripts/updateCoursesDB.js
 */

// Load environment variables
require('dotenv').config();

// Import Mongoose
const mongoose = require('mongoose');
const { Course, Enrollment } = require('../models');

// Connect to MongoDB (replace with your actual connection string)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/center-v1')
  .then(() => {
    console.log('Connected to MongoDB');
    updateCourses();
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

async function updateCourses() {
  try {
    console.log('Starting course update...');

    // Method 1: Direct database update using updateMany
    const updateResult = await Course.updateMany(
      { enrolledStudents: { $exists: false } },
      { $set: { enrolledStudents: 0 } }
    );
    console.log(`Updated ${updateResult.modifiedCount} courses using updateMany`);

    // Method 2: Get all courses and update them individually with proper enrollment count
    const courses = await Course.find().populate('enrollments');
    console.log(`Found ${courses.length} courses total`);

    let updatedCount = 0;
    for (const course of courses) {
      // Calculate the enrollment count
      const enrollmentCount = course.enrollments ? course.enrollments.length : 0;
      
      // Only update if enrolledStudents is not set or is different from the count
      if (course.enrolledStudents === undefined || 
          course.enrolledStudents === null || 
          course.enrolledStudents !== enrollmentCount) {
        
        // Update the course
        course.enrolledStudents = enrollmentCount;
        await course.save();
        
        console.log(`Updated ${course.name} with enrolledStudents=${enrollmentCount}`);
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} courses with correct enrollment counts`);

    // Verify the results
    const verifiedCourses = await Course.find({}, 'name enrolledStudents');
    console.log('\nVerification Results:');
    verifiedCourses.forEach(course => {
      console.log(`${course.name}: enrolledStudents=${course.enrolledStudents}`);
    });

    console.log('\nUpdate completed successfully');
    
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Error updating courses:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
} 
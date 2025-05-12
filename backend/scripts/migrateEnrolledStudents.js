/**
 * This script updates all existing courses to have the enrolledStudents field
 * populated based on their enrollment count.
 * 
 * Run with: node scripts/migrateEnrolledStudents.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Course, Enrollment } = require('../models');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function migrateCourses() {
  try {
    // Find all courses
    const courses = await Course.find().populate('enrollments');
    console.log(`Found ${courses.length} courses to update`);
    
    let updateCount = 0;
    
    // Update each course
    for (const course of courses) {
      // Only update if enrolledStudents is not set
      if (course.enrolledStudents === undefined || course.enrolledStudents === null) {
        // Count enrollments
        const enrollmentCount = course.enrollments ? course.enrollments.length : 0;
        
        // Update course with enrollment count
        course.enrolledStudents = enrollmentCount;
        await course.save();
        
        console.log(`Updated course "${course.name}" (${course._id}): enrolledStudents = ${enrollmentCount}`);
        updateCount++;
      }
    }
    
    console.log(`Migration complete. Updated ${updateCount} courses.`);
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateCourses(); 
const { withTestDb } = require('../utils/testDb');
const { Teacher, Student, Course, Enrollment } = require('../models');

// Test database connection and CRUD operations
async function testDatabaseOperations(sampleData) {
  console.log('Starting database tests...');
  
  // Get count of records
  const teacherCount = await Teacher.countDocuments();
  const studentCount = await Student.countDocuments();
  const courseCount = await Course.countDocuments();
  const enrollmentCount = await Enrollment.countDocuments();
  
  console.log(`Initial counts - Teachers: ${teacherCount}, Students: ${studentCount}, Courses: ${courseCount}, Enrollments: ${enrollmentCount}`);
  
  // Test Teacher operations
  console.log('\nTesting Teacher operations:');
  const newTeacher = await Teacher.create({
    name: 'Michael Johnson',
    email: 'michael.johnson@example.com',
    phone: '555-123-4567',
    specialization: 'Business English',
    qualification: 'PhD Linguistics',
    availability: [
      { day: 'Monday', startTime: '14:00', endTime: '20:00' },
      { day: 'Thursday', startTime: '14:00', endTime: '20:00' }
    ]
  });
  console.log('Created new teacher:', newTeacher.name);
  
  const foundTeacher = await Teacher.findById(newTeacher._id);
  console.log('Retrieved teacher by ID:', foundTeacher.name);
  
  foundTeacher.qualification = 'PhD Applied Linguistics';
  await foundTeacher.save();
  console.log('Updated teacher qualification:', foundTeacher.qualification);
  
  await Teacher.findByIdAndDelete(newTeacher._id);
  console.log('Deleted teacher');
  
  // Test Course operations
  console.log('\nTesting Course operations:');
  const teacher = sampleData.teachers[0];
  const now = new Date();
  
  const newCourse = new Course({
    name: 'Business English Workshop',
    branch: 'Corporate Center',
    teacher: teacher._id,
    startDate: now,
    totalSessions: 8,
    weeklySchedule: [
      { day: 'Monday', startTime: '18:00', endTime: '20:00' },
      { day: 'Friday', startTime: '18:00', endTime: '20:00' }
    ],
    description: 'Short intensive business English workshop',
    level: 'Upper Intermediate',
    price: 500
  });
  
  await newCourse.save();
  console.log('Created new course:', newCourse.name);
  console.log('Session count:', newCourse.sessions.length);
  console.log('First session date:', newCourse.sessions[0].date);
  console.log('Last session date:', newCourse.sessions[newCourse.sessions.length - 1].date);
  
  // Test session status updating
  console.log('\nTesting Course session status updates:');
  newCourse.sessions[0].status = 'Taught';
  await newCourse.save();
  console.log('Course progress after marking one session as taught:', `${newCourse.progress}%`);
  
  // Test adding a compensatory session
  console.log('\nTesting compensatory session addition:');
  newCourse.sessions[1].status = 'Absent (Holiday)';
  await newCourse.save();
  
  const newSession = newCourse.addCompensatorySession(1);
  await newCourse.save();
  console.log('Added compensatory session for session #2:', newSession.date);
  console.log('New session count:', newCourse.sessions.length);
  
  // Test Enrollment operations
  console.log('\nTesting Enrollment operations:');
  const student = sampleData.students[0];
  
  const newEnrollment = await Enrollment.create({
    student: student._id,
    course: newCourse._id,
    totalAmount: 500,
    paymentStatus: 'Partial',
    amountPaid: 250
  });
  
  console.log('Created new enrollment for student:', student.name);
  console.log('Remaining balance:', newEnrollment.remainingBalance);
  
  // Test updating attendance
  newEnrollment.updateAttendance(newCourse.sessions[0].date, true, 'Excellent participation');
  await newEnrollment.save();
  console.log('Updated attendance for first session');
  console.log('Attendance percentage:', `${newEnrollment.attendancePercentage}%`);
  
  // Test enrollment count virtual on course
  const courseWithEnrollments = await Course.findById(newCourse._id).populate('enrollments');
  console.log('Course enrollment count:', courseWithEnrollments.enrollmentCount);
  
  // Clean up
  await Course.findByIdAndDelete(newCourse._id);
  await Enrollment.findByIdAndDelete(newEnrollment._id);
  console.log('\nTest cleanup completed');
  
  console.log('\nAll database tests completed successfully');
}

// Run the tests
withTestDb(testDatabaseOperations)
  .then(() => {
    console.log('Database test script completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Database test script failed:', error);
    process.exit(1);
  }); 
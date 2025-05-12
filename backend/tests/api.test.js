const request = require('supertest');
const mongoose = require('mongoose');
const { withTestDb } = require('../utils/testDb');
const app = require('../server');

// API tests to ensure routes are working
async function testAPIs(sampleData) {
  console.log('Starting API tests...');
  
  // Test health endpoint
  const healthResponse = await request(app).get('/api/health');
  console.log('Health check status:', healthResponse.status);
  console.log('Health check response:', healthResponse.body);
  
  if (healthResponse.status !== 200) {
    throw new Error('Health check failed');
  }
  
  // Test Teacher routes
  console.log('\nTesting Teacher routes:');
  
  // Get all teachers
  const teachersResponse = await request(app).get('/api/teachers');
  console.log('GET /api/teachers status:', teachersResponse.status);
  console.log('Teacher count:', teachersResponse.body.length);
  
  // Get teacher by ID
  const teacherId = sampleData.teachers[0]._id;
  const teacherResponse = await request(app).get(`/api/teachers/${teacherId}`);
  console.log('GET /api/teachers/:id status:', teacherResponse.status);
  console.log('Teacher name:', teacherResponse.body.name);
  
  // Create a teacher
  const newTeacherData = {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '555-987-6543',
    specialization: 'TOEFL Preparation',
    qualification: 'MA Applied Linguistics',
    availability: [
      { day: 'Monday', startTime: '15:00', endTime: '21:00' },
      { day: 'Thursday', startTime: '15:00', endTime: '21:00' }
    ]
  };
  
  const createTeacherResponse = await request(app)
    .post('/api/teachers')
    .send(newTeacherData);
  
  console.log('POST /api/teachers status:', createTeacherResponse.status);
  console.log('Created teacher ID:', createTeacherResponse.body._id);
  
  // Test Student routes
  console.log('\nTesting Student routes:');
  
  // Get all students
  const studentsResponse = await request(app).get('/api/students');
  console.log('GET /api/students status:', studentsResponse.status);
  console.log('Student count:', studentsResponse.body.length);
  
  // Get student by ID
  const studentId = sampleData.students[0]._id;
  const studentResponse = await request(app).get(`/api/students/${studentId}`);
  console.log('GET /api/students/:id status:', studentResponse.status);
  console.log('Student name:', studentResponse.body.name);
  
  // Test Course routes
  console.log('\nTesting Course routes:');
  
  // Get all courses
  const coursesResponse = await request(app).get('/api/courses');
  console.log('GET /api/courses status:', coursesResponse.status);
  console.log('Course count:', coursesResponse.body.length);
  
  // Get course by ID
  const courseId = sampleData.courses[0]._id;
  const courseResponse = await request(app).get(`/api/courses/${courseId}`);
  console.log('GET /api/courses/:id status:', courseResponse.status);
  console.log('Course name:', courseResponse.body.name);
  
  // Get course sessions
  const sessionsResponse = await request(app).get(`/api/courses/${courseId}/sessions`);
  console.log('GET /api/courses/:id/sessions status:', sessionsResponse.status);
  console.log('Session count:', sessionsResponse.body.length);
  
  // Get course progress
  const progressResponse = await request(app).get(`/api/courses/${courseId}/progress`);
  console.log('GET /api/courses/:id/progress status:', progressResponse.status);
  console.log('Course progress:', progressResponse.body.progressPercentage + '%');
  
  // Test updating a session status
  if (sessionsResponse.body.length > 0) {
    const updateSessionResponse = await request(app)
      .put(`/api/courses/${courseId}/sessions/0`)
      .send({ status: 'Taught', notes: 'Test session completed' });
    
    console.log('PUT /api/courses/:id/sessions/:sessionIndex status:', updateSessionResponse.status);
    console.log('Updated session status:', updateSessionResponse.body[0].status);
    
    // Check progress updated
    const updatedProgressResponse = await request(app).get(`/api/courses/${courseId}/progress`);
    console.log('Updated course progress:', updatedProgressResponse.body.progressPercentage + '%');
  }
  
  // Test Enrollment routes
  console.log('\nTesting Enrollment routes:');
  
  // Get enrollments for a course
  const courseEnrollmentsResponse = await request(app).get(`/api/courses/${courseId}/enrollments`);
  console.log('GET /api/courses/:id/enrollments status:', courseEnrollmentsResponse.status);
  console.log('Enrollment count:', courseEnrollmentsResponse.body.length);
  
  // Get enrollments for a student
  const studentEnrollmentsResponse = await request(app).get(`/api/students/${studentId}/enrollments`);
  console.log('GET /api/students/:id/enrollments status:', studentEnrollmentsResponse.status);
  console.log('Student enrollment count:', studentEnrollmentsResponse.body.length);
  
  // Enroll a student in a course (could fail if already enrolled)
  const enrollmentData = {
    courseId: sampleData.courses[1]._id,
    totalAmount: 300,
    amountPaid: 150
  };
  
  try {
    const enrollResponse = await request(app)
      .post(`/api/students/${studentId}/enroll`)
      .send(enrollmentData);
    
    console.log('POST /api/students/:id/enroll status:', enrollResponse.status);
    console.log('New enrollment payment status:', enrollResponse.body.paymentStatus);
  } catch (error) {
    console.log('Enrollment might have already existed:', error.message);
  }
  
  console.log('\nAPI tests completed successfully');
}

// Run the tests
withTestDb(testAPIs)
  .then(() => {
    console.log('API test script completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('API test script failed:', error);
    process.exit(1);
  }); 
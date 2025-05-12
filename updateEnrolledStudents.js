// Run this directly in the browser console on the courses page
// This will update all courses via the API by making an edit request for each course

(async function updateAllCoursesEnrolledStudents() {
  // Get all courses
  const response = await fetch('/api/courses');
  const courses = await response.json();
  
  console.log(`Found ${courses.length} courses to update`);
  
  // For each course
  for (const course of courses) {
    // Set enrolledStudents if it doesn't exist
    if (course.enrolledStudents === undefined || course.enrolledStudents === null) {
      const enrollmentCount = course.enrollmentCount || 0;
      
      // Create update data
      const updateData = {
        ...course,
        enrolledStudents: enrollmentCount
      };
      
      // Remove virtuals and other non-updatable properties
      delete updateData.enrollmentCount;
      delete updateData.progress;
      delete updateData.estimatedEndDate;
      delete updateData.id;
      
      // Send update request
      console.log(`Updating course ${course.name} with enrolledStudents=${enrollmentCount}`);
      
      try {
        const updateResponse = await fetch(`/api/courses/${course._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
        
        if (updateResponse.ok) {
          console.log(`Successfully updated course ${course.name}`);
        } else {
          console.error(`Failed to update course ${course.name}`, await updateResponse.text());
        }
      } catch (error) {
        console.error(`Error updating course ${course.name}:`, error);
      }
    }
  }
  
  console.log('Update process completed');
})(); 